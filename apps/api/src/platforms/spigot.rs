use std::time::Instant;

use futures::future::join_all;

use super::{elapsed_ms, sort_by_downloads_desc};
use crate::clients::numeric_id;
use crate::clients::spigot::{SpigotApi, author_avatar_url, resource_icon_fallback_url};
use crate::error::AppError;
use crate::format::{iso_from_ms, to_fixed};
use crate::image::enrich_image_from_base64;
use crate::model::{BadgeData, CardData, ProjectItem, Stat, Stats, VersionItem, non_empty};
use crate::platform::MAX_COUNT;
use crate::state::AppState;

// Spigot dates are unix seconds.
fn seconds_to_iso(seconds: Option<i64>) -> Option<String> {
    seconds.filter(|s| *s != 0).and_then(|s| iso_from_ms(s * 1000))
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

    let (versions, total_version_count) = match api.get_resource_versions(&id, MAX_COUNT).await {
        Ok(Some(mut versions)) => {
            let total = versions.len() as f64;
            versions.sort_by_key(|v| std::cmp::Reverse(v.release_date.unwrap_or(0)));
            let versions = versions
                .into_iter()
                .map(|version| VersionItem {
                    version_number: non_empty(version.name.as_deref()).unwrap_or_else(|| "Unknown".into()),
                    date: iso_from_ms(version.release_date.unwrap_or(0) * 1000),
                    loaders: Vec::new(),
                    game_versions: Vec::new(),
                    downloads: version.downloads,
                })
                .collect();
            (versions, total)
        }
        _ => (Vec::new(), 0.0),
    };

    let rating = resource.rating.clone().unwrap_or_default();
    let stats = Stats::default()
        .with("downloads", resource.downloads)
        .with("likes", resource.likes)
        .with("rating", rating.average)
        .with("ratingCount", rating.count)
        .with("versionCount", total_version_count);

    Ok(Some(CardData {
        name: non_empty(resource.name.as_deref()),
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

    let (resources, ratings, total_downloads, all_version_dates) = match api.get_author_resources(&id, 50).await {
        Ok(response) => {
            let mut all = response.unwrap_or_default();
            let total_downloads: f64 = all.iter().map(|r| r.downloads).sum();
            let all_version_dates: Vec<String> = all.iter().filter_map(|r| seconds_to_iso(r.release_date)).collect();

            sort_by_downloads_desc(&mut all, |r| r.downloads);
            all.truncate(MAX_COUNT);
            let ratings: Vec<f64> = all.iter().map(|r| r.rating_average()).collect();
            let resources = join_all(all.iter().map(|r| async {
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
            (resources, ratings, total_downloads, all_version_dates)
        }
        Err(_) => (Vec::new(), Vec::new(), 0.0, Vec::new()),
    };

    let rated: Vec<f64> = ratings.into_iter().filter(|r| *r > 0.0).collect();
    let avg_rating = if rated.is_empty() {
        Stat::Num(0.0)
    } else {
        Stat::Text(to_fixed(rated.iter().sum::<f64>() / rated.len() as f64, 1))
    };

    let mut stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("totalFollowers", 0.0)
        .with("resourceCount", resources.len() as f64);
    stats = match avg_rating {
        Stat::Num(n) => stats.with("avgRating", n),
        Stat::Text(text) => stats.with_text("avgRating", text),
    };

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
    let version_count = match api.get_resource_versions(&id, 10).await {
        Ok(Some(versions)) => versions.len() as f64,
        _ => 0.0,
    };

    let rating = resource.rating.clone().unwrap_or_default();
    let stats = Stats::default()
        .with("downloads", resource.downloads)
        .with("likes", resource.likes)
        .with("rating", rating.average)
        .with("ratingCount", rating.count)
        .with("versionCount", version_count);
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
    let rated: Vec<f64> = resources
        .iter()
        .map(|r| r.rating_average())
        .filter(|r| *r != 0.0)
        .collect();
    let avg_rating = if rated.is_empty() {
        0.0
    } else {
        rated.iter().sum::<f64>() / rated.len() as f64
    };

    let stats = Stats::default()
        .with("totalDownloads", total_downloads)
        .with("totalFollowers", 0.0)
        .with("resourceCount", resources.len() as f64)
        .with("avgRating", avg_rating);
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}
