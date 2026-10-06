use std::time::Instant;

use super::{all_version_dates, attach_version_dates, date_ms, elapsed_ms, sort_by_date_desc, sort_by_downloads_desc};
use crate::clients::modrinth::{ModrinthApi, ProjectV2, ProjectV3};
use crate::error::AppError;
use crate::image::{enrich_image, fetch_project_icons};
use crate::model::{BadgeData, CardData, ProjectItem, Stats, VersionItem, non_empty};
use crate::platform::MAX_COUNT;
use crate::state::AppState;

fn is_server_project_type(project_type: &str) -> bool {
    matches!(project_type, "minecraft_java_server" | "minecraft_bedrock_server")
}

fn item_from_v2(project: &ProjectV2) -> ProjectItem {
    ProjectItem {
        id: project.id.clone(),
        title: project.title.clone().unwrap_or_default(),
        downloads: project.downloads,
        followers: project.followers,
        icon_url: project.icon_url.clone(),
        project_type: non_empty(project.project_type.as_deref()).unwrap_or_else(|| "mod".into()),
        loaders: project.loaders.clone(),
        ..Default::default()
    }
}

fn item_from_v3(project: &ProjectV3) -> ProjectItem {
    ProjectItem {
        id: project.id.clone(),
        title: project.name.clone().unwrap_or_default(),
        downloads: project.downloads,
        followers: project.followers,
        icon_url: project.icon_url.clone(),
        project_type: non_empty(project.project_types.first().map(String::as_str)).unwrap_or_else(|| "mod".into()),
        loaders: project.loaders.clone(),
        ..Default::default()
    }
}

fn aggregate(mut items: Vec<ProjectItem>) -> (Stats, Vec<ProjectItem>) {
    let stats = Stats::default()
        .with("totalDownloads", items.iter().map(|p| p.downloads).sum::<f64>())
        .with("totalFollowers", items.iter().map(|p| p.followers).sum::<f64>())
        .with("projectCount", items.len() as f64);
    sort_by_downloads_desc(&mut items, |p| p.downloads);
    items.truncate(MAX_COUNT);
    (stats, items)
}

fn filter_type(items: Vec<ProjectItem>, project_type: Option<&str>) -> Vec<ProjectItem> {
    match project_type {
        Some(project_type) => items.into_iter().filter(|p| p.project_type == project_type).collect(),
        None => items,
    }
}

async fn enrich_top_projects(api: &ModrinthApi<'_>, top: &mut [ProjectItem]) {
    fetch_project_icons(api.upstream, top).await;
    attach_version_dates(top, |id| async move {
        match api.project_versions(&id).await {
            Ok(Some(versions)) => versions
                .into_iter()
                .map(|v| v.date_published.unwrap_or_default())
                .collect(),
            _ => Vec::new(),
        }
    })
    .await;
}

pub async fn user_card(
    state: &AppState,
    username: &str,
    project_type: Option<&str>,
) -> Result<Option<CardData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let (user, projects) = tokio::join!(api.user(username), api.user_projects(username));
    let Some(user) = user? else { return Ok(None) };
    let projects = projects?.unwrap_or_default();
    let api_ms = elapsed_ms(start);

    let items = filter_type(projects.iter().map(item_from_v2).collect(), project_type);
    let (stats, mut top) = aggregate(items);

    let (image, ()) = tokio::join!(
        enrich_image(&state.upstream, user.avatar_url.as_deref()),
        enrich_top_projects(&api, &mut top)
    );

    Ok(Some(CardData {
        name: non_empty(user.name.as_deref()).or_else(|| non_empty(Some(&user.username))),
        summary: user.bio,
        image,
        all_version_dates: all_version_dates(&top),
        projects: top,
        stats,
        api_ms,
        ..Default::default()
    }))
}

pub async fn project_card(state: &AppState, slug: &str) -> Result<Option<CardData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let (project, versions) = tokio::join!(api.project_v3(slug), api.project_versions(slug));
    let Some(project) = project? else { return Ok(None) };
    let mut versions = versions?.unwrap_or_default();
    let is_server = project.project_types.iter().any(|t| is_server_project_type(t));
    let api_ms = elapsed_ms(start);

    let image = enrich_image(&state.upstream, project.icon_url.as_deref()).await;

    let stats = if is_server {
        let java = project.minecraft_java_server.as_ref();
        Stats::default()
            .with(
                "playersOnline",
                java.and_then(|j| j.ping.as_ref())
                    .and_then(|p| p.data.as_ref())
                    .and_then(|d| d.players_online),
            )
            .with("verifiedPlays2w", java.and_then(|j| j.verified_plays_2w))
            .with("downloads", project.downloads)
    } else {
        Stats::default()
            .with("downloads", project.downloads)
            .with("followers", project.followers)
            .with("versionCount", versions.len() as f64)
    };

    let latest = if is_server {
        Vec::new()
    } else {
        sort_by_date_desc(&mut versions, |v| date_ms(v.date_published.as_deref()));
        versions
            .into_iter()
            .take(MAX_COUNT)
            .map(|v| VersionItem {
                version_number: non_empty(v.version_number.as_deref())
                    .or_else(|| non_empty(v.name.as_deref()))
                    .unwrap_or_else(|| "Unknown".into()),
                date: v.date_published,
                loaders: v.loaders,
                game_versions: v.game_versions,
                downloads: v.downloads,
            })
            .collect()
    };

    Ok(Some(CardData {
        name: non_empty(project.name.as_deref()),
        summary: project.summary,
        image,
        project_type: project.project_types.first().cloned(),
        versions: latest,
        stats,
        entity_type: is_server.then_some("server"),
        api_ms,
        ..Default::default()
    }))
}

pub async fn organization_card(
    state: &AppState,
    id: &str,
    project_type: Option<&str>,
) -> Result<Option<CardData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let (organization, projects) = tokio::join!(api.organization(id), api.organization_projects(id));
    let Some(organization) = organization? else {
        return Ok(None);
    };
    let projects = projects?.unwrap_or_default();
    let api_ms = elapsed_ms(start);

    let items = filter_type(projects.iter().map(item_from_v3).collect(), project_type);
    let (stats, mut top) = aggregate(items);

    let (image, ()) = tokio::join!(
        enrich_image(&state.upstream, organization.icon_url.as_deref()),
        enrich_top_projects(&api, &mut top)
    );

    Ok(Some(CardData {
        name: non_empty(organization.name.as_deref()),
        summary: organization.description,
        image,
        all_version_dates: all_version_dates(&top),
        projects: top,
        stats,
        api_ms,
        ..Default::default()
    }))
}

pub async fn collection_card(state: &AppState, id: &str) -> Result<Option<CardData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let Some(collection) = api.collection(id).await? else {
        return Ok(None);
    };
    let projects = if collection.projects.is_empty() {
        Vec::new()
    } else {
        api.projects(&collection.projects).await?.unwrap_or_default()
    };
    let api_ms = elapsed_ms(start);

    let (stats, mut top) = aggregate(projects.iter().map(item_from_v2).collect());

    let (image, ()) = tokio::join!(
        enrich_image(&state.upstream, collection.icon_url.as_deref()),
        enrich_top_projects(&api, &mut top)
    );

    Ok(Some(CardData {
        name: non_empty(collection.name.as_deref()),
        summary: collection.description,
        image,
        all_version_dates: all_version_dates(&top),
        projects: top,
        stats,
        api_ms,
        ..Default::default()
    }))
}

fn totals(downloads: f64, followers: f64, count: usize) -> Stats {
    Stats::default()
        .with("totalDownloads", downloads)
        .with("totalFollowers", followers)
        .with("projectCount", count as f64)
}

pub async fn user_badge(state: &AppState, username: &str) -> Result<Option<BadgeData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let (user, projects) = tokio::join!(api.user(username), api.user_projects(username));
    if user?.is_none() {
        return Ok(None);
    }
    let projects = projects?.unwrap_or_default();
    let stats = totals(
        projects.iter().map(|p| p.downloads).sum(),
        projects.iter().map(|p| p.followers).sum(),
        projects.len(),
    );
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn project_badge(state: &AppState, slug: &str) -> Result<Option<BadgeData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let Some(project) = api.project_v3(slug).await? else {
        return Ok(None);
    };
    let version_count = match api.project_versions(slug).await {
        Ok(Some(versions)) => versions.len() as f64,
        _ => 0.0,
    };
    let stats = Stats::default()
        .with("downloads", project.downloads)
        .with("followers", project.followers)
        .with("versionCount", version_count);
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn organization_badge(state: &AppState, id: &str) -> Result<Option<BadgeData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let (organization, projects) = tokio::join!(api.organization(id), api.organization_projects(id));
    if organization?.is_none() {
        return Ok(None);
    }
    let projects = projects?.unwrap_or_default();
    let stats = totals(
        projects.iter().map(|p| p.downloads).sum(),
        projects.iter().map(|p| p.followers).sum(),
        projects.len(),
    );
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}

pub async fn collection_badge(state: &AppState, id: &str) -> Result<Option<BadgeData>, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let start = Instant::now();
    let Some(collection) = api.collection(id).await? else {
        return Ok(None);
    };
    let projects = if collection.projects.is_empty() {
        Vec::new()
    } else {
        api.projects(&collection.projects).await?.unwrap_or_default()
    };
    let stats = totals(
        projects.iter().map(|p| p.downloads).sum(),
        projects.iter().map(|p| p.followers).sum(),
        projects.len(),
    );
    Ok(Some(BadgeData {
        stats,
        api_ms: elapsed_ms(start),
    }))
}
