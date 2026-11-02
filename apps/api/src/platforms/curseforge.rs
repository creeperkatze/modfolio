use std::time::Instant;

use futures::future::join_all;

use super::{all_version_dates, attach_version_dates, elapsed_ms, sort_by_date_desc};
use crate::clients::curseforge::{
    CurseforgeApi, SORT_TOTAL_DOWNLOADS, SearchOptions, extract_game_versions, extract_loaders, file_date_ms,
    latest_file,
};
use crate::clients::numeric_id;
use crate::error::AppError;
use crate::image::enrich_image;
use crate::model::{BadgeData, CardData, ProjectItem, Stats, VersionItem, non_empty};
use crate::platform::MAX_COUNT;
use crate::state::AppState;

// Avatars use a `{0}` size placeholder.
fn sized_avatar(url: Option<&str>) -> Option<String> {
    url.map(|u| u.replacen("{0}", "300x300", 1))
}

pub async fn mod_card(state: &AppState, mod_id: &str) -> Result<Option<CardData>, AppError> {
    let Some(mod_id) = numeric_id(mod_id) else {
        return Ok(None);
    };
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(m) = api.get_mod(&mod_id).await? else {
        return Ok(None);
    };
    let image = enrich_image(&state.upstream, m.logo_url()).await;

    // Always fetch the max for caching.
    let (versions, total_file_count) = match api.get_mod_files(&mod_id, MAX_COUNT).await {
        Ok(Some(response)) => {
            let total = response.total_count().unwrap_or(response.data.len() as f64);
            let mut files = response.data;
            sort_by_date_desc(&mut files, file_date_ms);
            let versions = files
                .iter()
                .take(MAX_COUNT)
                .map(|file| VersionItem {
                    version_number: non_empty(file.display_name.as_deref())
                        .or_else(|| non_empty(file.file_name.as_deref()))
                        .unwrap_or_else(|| "Unknown".into()),
                    date: file.file_date.clone(),
                    loaders: extract_loaders(file),
                    game_versions: extract_game_versions(file),
                    downloads: file.download_count,
                })
                .collect();
            (versions, total)
        }
        _ => (Vec::new(), 0.0),
    };

    let stats = Stats::default()
        .with("downloads", m.download_count)
        .with("versionCount", total_file_count)
        .with("fileCount", total_file_count)
        .with("rank", m.game_popularity_rank.filter(|r| *r != 0.0));

    Ok(Some(CardData {
        name: non_empty(m.name.as_deref()),
        summary: m.summary.clone(),
        image,
        class_id: m.class_id,
        versions,
        stats,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn user_card(state: &AppState, user_id: &str, class_id: Option<&str>) -> Result<Option<CardData>, AppError> {
    let class_id = class_id.and_then(|c| c.parse::<u32>().ok());
    let Some(user_id) = numeric_id(user_id) else {
        return Ok(None);
    };
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(user) = api.get_user(&user_id).await? else {
        return Ok(None);
    };
    let avatar_url = sized_avatar(user.avatar_url.as_deref());
    let image = enrich_image(&state.upstream, avatar_url.as_deref()).await;

    let search = api
        .search_mods(SearchOptions {
            author_id: Some(user_id.clone()),
            page_size: Some(MAX_COUNT as u32),
            sort_field: Some(SORT_TOTAL_DOWNLOADS),
            sort_order: Some("desc"),
            class_id: class_id.map(|c| c.to_string()),
            ..Default::default()
        })
        .await;

    let (mut projects, project_count) = match search {
        Ok(response) => {
            let count = response
                .total_count()
                .filter(|c| *c != 0.0)
                .unwrap_or(response.data.len() as f64);
            let projects = join_all(response.data.iter().map(|m| async {
                let logo = m.logo_url();
                let icon = enrich_image(&state.upstream, logo).await;
                ProjectItem {
                    id: m.id.to_string(),
                    title: m.name.clone().unwrap_or_default(),
                    downloads: m.download_count,
                    followers: 0.0, // CurseForge has no per-mod followers.
                    icon: icon.or_else(|| non_empty(logo)),
                    project_type: "mod".into(),
                    loaders: latest_file(&m.latest_files).map(extract_loaders).unwrap_or_default(),
                    ..Default::default()
                }
            }))
            .await;
            (projects, count)
        }
        Err(_) => (Vec::new(), 0.0),
    };

    attach_version_dates(&mut projects, |id| {
        let api = &api;
        async move {
            match api.get_mod_files(&id, 50).await {
                Ok(Some(files)) => files
                    .data
                    .into_iter()
                    .map(|f| f.file_date.unwrap_or_default())
                    .collect(),
                _ => Vec::new(),
            }
        }
    })
    .await;

    // A class filter only counts the filtered projects.
    let projects_downloads: f64 = projects.iter().map(|p| p.downloads).sum();
    let total_downloads = if class_id.is_some() {
        projects_downloads
    } else {
        user.mods_download_count
            .filter(|d| *d != 0.0)
            .unwrap_or(projects_downloads)
    };

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("projectCount", project_count)
        .with("totalFollowers", user.follower_count.unwrap_or(0.0));

    Ok(Some(CardData {
        name: non_empty(user.display_name.as_deref()),
        image: image.or(avatar_url),
        all_version_dates: all_version_dates(&projects),
        projects,
        stats,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn mod_badge(state: &AppState, mod_id: &str) -> Result<Option<BadgeData>, AppError> {
    let Some(mod_id) = numeric_id(mod_id) else {
        return Ok(None);
    };
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(m) = api.get_mod(&mod_id).await? else {
        return Ok(None);
    };
    let file_count = match api.get_mod_files(&mod_id, MAX_COUNT).await {
        Ok(Some(files)) => files.total_count().unwrap_or(files.data.len() as f64),
        _ => 0.0,
    };

    let stats = Stats::default()
        .with("downloads", m.download_count)
        .with("versionCount", file_count)
        .with("fileCount", file_count)
        .with("rank", m.game_popularity_rank.filter(|r| *r != 0.0));
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn user_badge(state: &AppState, user_id: &str) -> Result<Option<BadgeData>, AppError> {
    let Some(user_id) = numeric_id(user_id) else {
        return Ok(None);
    };
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(user) = api.get_user(&user_id).await? else {
        return Ok(None);
    };
    let project_count = api
        .search_mods(SearchOptions {
            author_id: Some(user_id),
            page_size: Some(1),
            ..Default::default()
        })
        .await
        .ok()
        .and_then(|r| r.total_count())
        .unwrap_or(0.0);

    let stats = Stats::default()
        .with("totalDownloads", user.mods_download_count.unwrap_or(0.0))
        .with("projectCount", project_count)
        .with("totalFollowers", user.follower_count.unwrap_or(0.0));
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}
