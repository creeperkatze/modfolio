use std::time::Instant;

use serde_json::Value;

use super::{all_version_dates, attach_version_dates, date_ms, elapsed_ms, sort_by_date_desc, sort_by_downloads_desc};
use crate::clients::hangar::HangarApi;
use crate::error::AppError;
use crate::image::{enrich_image, fetch_project_icons};
use crate::model::{BadgeData, CardData, ProjectItem, Stats, VersionItem, non_empty};
use crate::platform::MAX_COUNT;
use crate::state::AppState;

fn api(state: &AppState) -> HangarApi<'_> {
    HangarApi {
        upstream: &state.upstream,
        owners: &state.hangar_owners,
    }
}

pub async fn project_card(state: &AppState, slug: &str) -> Result<Option<CardData>, AppError> {
    let api = api(state);
    let start = Instant::now();

    let Some(project) = api.get_project(slug).await? else {
        return Ok(None);
    };
    let image = enrich_image(&state.upstream, project.avatar_url.as_deref()).await;

    // Always fetch the max for caching.
    let (versions, total_version_count) = match api.get_project_versions(slug, MAX_COUNT).await {
        Ok(Some(response)) => {
            let total = response.count().unwrap_or(response.result.len() as f64);
            let mut versions = response.result;
            sort_by_date_desc(&mut versions, |v| date_ms(v.created_at.as_deref()));
            let versions = versions
                .into_iter()
                .map(|version| {
                    let mut game_versions: Vec<String> = Vec::new();
                    for list in version.platform_dependencies.values() {
                        for v in list.as_array().into_iter().flatten().filter_map(Value::as_str) {
                            if !game_versions.iter().any(|g| g == v) {
                                game_versions.push(v.to_string());
                            }
                        }
                    }
                    VersionItem {
                        version_number: non_empty(version.name.as_deref()).unwrap_or_else(|| "Unknown".into()),
                        date: version.created_at,
                        loaders: version.downloads.keys().cloned().collect(),
                        game_versions,
                        downloads: version.stats.map_or(0.0, |s| s.total_downloads),
                    }
                })
                .collect();
            (versions, total)
        }
        _ => (Vec::new(), 0.0),
    };

    let project_stats = project.stats();
    let stats = Stats::default()
        .with("downloads", project_stats.downloads)
        .with("stars", project_stats.stars)
        .with("versionCount", total_version_count);

    Ok(Some(CardData {
        name: non_empty(project.name.as_deref()),
        image,
        versions,
        stats,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn user_card(state: &AppState, username: &str) -> Result<Option<CardData>, AppError> {
    let api = api(state);
    let start = Instant::now();

    let Some(user) = api.get_user(username).await? else {
        return Ok(None);
    };
    let image = enrich_image(&state.upstream, user.avatar_url.as_deref()).await;

    let (projects, total_downloads, total_stars) = match api.get_user_projects(username, 50).await {
        Ok(response) => {
            let mut all = response.map(|r| r.result).unwrap_or_default();
            let total_downloads: f64 = all.iter().map(|p| p.stats().downloads).sum();
            let total_stars: f64 = all.iter().map(|p| p.stats().stars).sum();
            sort_by_downloads_desc(&mut all, |p| p.stats().downloads);

            let mut projects: Vec<ProjectItem> = all
                .iter()
                .take(MAX_COUNT)
                .map(|project| ProjectItem {
                    id: project
                        .namespace
                        .as_ref()
                        .and_then(|ns| ns.slug.clone())
                        .unwrap_or_default(),
                    title: project.name.clone().unwrap_or_default(),
                    downloads: project.stats().downloads,
                    // Hangar has stars instead of followers.
                    followers: project.stats().stars,
                    icon_url: project.avatar_url.clone(),
                    project_type: "mod".into(),
                    ..Default::default()
                })
                .collect();

            fetch_project_icons(&state.upstream, &mut projects).await;
            attach_version_dates(&mut projects, |slug| {
                let api = &api;
                async move {
                    match api.get_project_versions(&slug, 10).await {
                        Ok(Some(versions)) => versions
                            .result
                            .into_iter()
                            .map(|v| v.created_at.unwrap_or_default())
                            .collect(),
                        _ => Vec::new(),
                    }
                }
            })
            .await;
            (projects, total_downloads, total_stars)
        }
        Err(_) => (Vec::new(), 0.0, 0.0),
    };

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("totalStars", total_stars)
        .with(
            "projectCount",
            user.project_count
                .filter(|c| *c != 0.0)
                .unwrap_or(projects.len() as f64),
        );

    Ok(Some(CardData {
        name: non_empty(user.name.as_deref()),
        image: image.or_else(|| non_empty(user.avatar_url.as_deref())),
        all_version_dates: all_version_dates(&projects),
        projects,
        stats,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn project_badge(state: &AppState, slug: &str) -> Result<Option<BadgeData>, AppError> {
    let api = api(state);
    let start = Instant::now();

    let Some(project) = api.get_project(slug).await? else {
        return Ok(None);
    };
    let version_count = match api.get_project_versions(slug, 10).await {
        Ok(Some(versions)) => versions.count().unwrap_or(versions.result.len() as f64),
        _ => 0.0,
    };

    let project_stats = project.stats();
    let stats = Stats::default()
        .with("downloads", project_stats.downloads)
        .with("views", project_stats.views)
        .with("versionCount", version_count);
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn user_badge(state: &AppState, username: &str) -> Result<Option<BadgeData>, AppError> {
    let api = api(state);
    let start = Instant::now();

    let Some(user) = api.get_user(username).await? else {
        return Ok(None);
    };
    let (total_downloads, total_stars, project_count) = match api.get_user_projects(username, 100).await {
        Ok(Some(response)) => (
            response.result.iter().map(|p| p.stats().downloads).sum(),
            response.result.iter().map(|p| p.stats().stars).sum(),
            response.count().unwrap_or(response.result.len() as f64),
        ),
        Ok(None) => (0.0, 0.0, 0.0),
        Err(_) => (0.0, 0.0, user.project_count.unwrap_or(0.0)),
    };

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("projectCount", project_count)
        .with("totalStars", total_stars);
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}
