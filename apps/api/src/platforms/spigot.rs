use std::time::Instant;

use futures::future::join_all;

use super::{elapsed_ms, sort_by_downloads_desc};
use crate::clients::numeric_id;
use crate::clients::spigot::{SpigotApi, author_avatar_url, resource_icon_fallback_url};
use crate::error::AppError;
use crate::format::{iso_from_ms, to_fixed};
use crate::image::enrich_image_from_base64;
use crate::model::{BadgeData, CardData, ProjectItem, Stats, VersionItem, non_empty};
use crate::platform::MAX_COUNT;
use crate::state::AppState;

// Spigot dates are unix seconds.
fn seconds_to_iso(seconds: Option<i64>) -> Option<String> {
    seconds.filter(|s| *s != 0).and_then(|s| iso_from_ms(s * 1000))
}

fn average_rating(ratings: impl Iterator<Item = f64>) -> Option<f64> {
    let rated: Vec<f64> = ratings.filter(|r| *r > 0.0).collect();
    (!rated.is_empty()).then(|| rated.iter().sum::<f64>() / rated.len() as f64)
}

fn with_rating(stats: Stats, field: &'static str, rating: Option<f64>) -> Stats {
    match rating {
        Some(rating) => stats.with_text(field, to_fixed(rating, 1)),
        None => stats,
    }
}

pub async fn resource_card(state: &AppState, resource_id: &str) -> Result<Option<CardData>, AppError> {
    let Some(id) = numeric_id(resource_id) else {
        return Ok(None);
    };
    let api = SpigotApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(resource) = api.get_resource(&id).await? else {
        return Ok(None);
    };
    let icon_data = resource.icon.as_ref().and_then(|i| i.data.as_deref());
    let image = enrich_image_from_base64(&state.upstream, icon_data, &resource_icon_fallback_url(resource.id)).await;

    let versions = match api.get_resource_versions(&id, MAX_COUNT).await {
        Ok(Some(mut versions)) => {
            versions.sort_by_key(|v| std::cmp::Reverse(v.release_date.unwrap_or(0)));
            versions
                .into_iter()
                .map(|version| VersionItem {
                    version_number: non_empty(version.name.as_deref()).unwrap_or_else(|| "Unknown".into()),
                    date: iso_from_ms(version.release_date.unwrap_or(0) * 1000),
                    loaders: Vec::new(),
                    game_versions: Vec::new(),
                    downloads: version.downloads,
                })
                .collect()
        }
        _ => Vec::new(),
    };

    let stats = Stats::default()
        .with("downloads", resource.downloads)
        .with("likes", resource.likes)
        .with("versionCount", resource.versions.len() as f64);
    let stats = with_rating(stats, "rating", Some(resource.rating_average()).filter(|r| *r > 0.0));

    Ok(Some(CardData {
        name: non_empty(resource.name.as_deref()),
        summary: resource.tag.clone(),
        image,
        versions,
        stats,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn author_card(state: &AppState, author_id: &str) -> Result<Option<CardData>, AppError> {
    let Some(id) = numeric_id(author_id) else {
        return Ok(None);
    };
    let api = SpigotApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(author) = api.get_author(&id).await? else {
        return Ok(None);
    };
    let icon_data = author.icon.as_ref().and_then(|i| i.data.as_deref());
    let image = enrich_image_from_base64(&state.upstream, icon_data, &author_avatar_url(&id)).await;

    let all = api
        .get_author_resources(&id, 100)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();
    let total_downloads: f64 = all.iter().map(|r| r.downloads).sum();
    let all_version_dates: Vec<String> = all.iter().filter_map(|r| seconds_to_iso(r.release_date)).collect();
    let average = average_rating(all.iter().map(|r| r.rating_average()));
    let resource_count = all.len();

    let mut top = all;
    sort_by_downloads_desc(&mut top, |r| r.downloads);
    top.truncate(MAX_COUNT);
    let resources = join_all(top.iter().map(|r| async {
        let icon_data = r.icon.as_ref().and_then(|i| i.data.as_deref());
        let fallback = resource_icon_fallback_url(r.id);
        ProjectItem {
            id: r.id.to_string(),
            title: r.name.clone().unwrap_or_default(),
            downloads: r.downloads,
            icon: enrich_image_from_base64(&state.upstream, icon_data, &fallback).await,
            project_type: "plugin".into(),
            ..Default::default()
        }
    }))
    .await;

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("totalFollowers", 0.0)
        .with("resourceCount", resource_count as f64);
    let stats = with_rating(stats, "avgRating", average);

    Ok(Some(CardData {
        name: non_empty(author.name.as_deref()),
        image,
        projects: resources,
        stats,
        all_version_dates,
        api_ms: elapsed_ms(start),
        ..Default::default()
    }))
}

pub async fn resource_badge(state: &AppState, resource_id: &str) -> Result<Option<BadgeData>, AppError> {
    let Some(id) = numeric_id(resource_id) else {
        return Ok(None);
    };
    let api = SpigotApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    let Some(resource) = api.get_resource(&id).await? else {
        return Ok(None);
    };
    let stats = Stats::default()
        .with("downloads", resource.downloads)
        .with("likes", resource.likes)
        .with("rating", resource.rating_average())
        .with("versionCount", resource.versions.len() as f64);
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn author_badge(state: &AppState, author_id: &str) -> Result<Option<BadgeData>, AppError> {
    let Some(id) = numeric_id(author_id) else {
        return Ok(None);
    };
    let api = SpigotApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();

    if api.get_author(&id).await?.is_none() {
        return Ok(None);
    }

    let resources = api
        .get_author_resources(&id, 100)
        .await
        .ok()
        .flatten()
        .unwrap_or_default();
    let total_downloads: f64 = resources.iter().map(|r| r.downloads).sum();
    let avg_rating = average_rating(resources.iter().map(|r| r.rating_average()));

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("totalFollowers", 0.0)
        .with("resourceCount", resources.len() as f64)
        .with("avgRating", avg_rating.unwrap_or(0.0));
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}
