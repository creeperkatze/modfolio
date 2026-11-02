use std::sync::Arc;

use axum::Router;
use axum::extract::{Path, Query, State};
use axum::response::Response;
use axum::routing::{MethodRouter, get};
use serde::Deserialize;

use super::SharedState;
use super::embed::{Client, Format, Output, hex_color};
use crate::cache::{self, CachedValue};
use crate::error::AppError;
use crate::format::{format_number, js_num, to_fixed};
use crate::generators::badge::{BadgeStyle, generate_badge};
use crate::model::{BadgeData, Stats};
use crate::platform::Platform;
use crate::platforms::{curseforge, hangar, modrinth, spigot};
use crate::state::AppState;

#[derive(Clone, Copy)]
enum Entity {
    ModrinthUser,
    ModrinthProject,
    ModrinthOrganization,
    ModrinthCollection,
    CurseforgeProject,
    CurseforgeUser,
    HangarProject,
    HangarUser,
    SpigotResource,
    SpigotAuthor,
}

#[derive(Clone, Copy)]
enum Metric {
    Downloads,
    Projects,
    Followers,
    Versions,
    Rank,
    Views,
    Stars,
    Likes,
    Rating,
    Resources,
}

impl Entity {
    fn platform(self) -> Platform {
        match self {
            Entity::ModrinthUser
            | Entity::ModrinthProject
            | Entity::ModrinthOrganization
            | Entity::ModrinthCollection => Platform::Modrinth,
            Entity::CurseforgeProject | Entity::CurseforgeUser => Platform::CurseForge,
            Entity::HangarProject | Entity::HangarUser => Platform::Hangar,
            Entity::SpigotResource | Entity::SpigotAuthor => Platform::Spigot,
        }
    }

    fn name(self) -> &'static str {
        match self {
            Entity::ModrinthUser | Entity::CurseforgeUser | Entity::HangarUser => "user",
            Entity::ModrinthProject | Entity::CurseforgeProject | Entity::HangarProject => "project",
            Entity::ModrinthOrganization => "organization",
            Entity::ModrinthCollection => "collection",
            Entity::SpigotResource => "resource",
            Entity::SpigotAuthor => "author",
        }
    }

    async fn fetch(self, state: &AppState, id: &str) -> Result<Option<BadgeData>, AppError> {
        match self {
            Entity::ModrinthUser => modrinth::user_badge(state, id).await,
            Entity::ModrinthProject => modrinth::project_badge(state, id).await,
            Entity::ModrinthOrganization => modrinth::organization_badge(state, id).await,
            Entity::ModrinthCollection => modrinth::collection_badge(state, id).await,
            Entity::CurseforgeProject => curseforge::mod_badge(state, id).await,
            Entity::CurseforgeUser => curseforge::user_badge(state, id).await,
            Entity::HangarProject => hangar::project_badge(state, id).await,
            Entity::HangarUser => hangar::user_badge(state, id).await,
            Entity::SpigotResource => spigot::resource_badge(state, id).await,
            Entity::SpigotAuthor => spigot::author_badge(state, id).await,
        }
    }

    fn label(self, metric: Metric) -> &'static str {
        match (self, metric) {
            (Entity::CurseforgeProject, Metric::Versions) => "Files",
            (_, Metric::Downloads) => "Downloads",
            (_, Metric::Projects) => "Projects",
            (_, Metric::Followers) => "Followers",
            (_, Metric::Versions) => "Versions",
            (_, Metric::Rank) => "Rank",
            (_, Metric::Views) => "Views",
            (_, Metric::Stars) => "Stars",
            (_, Metric::Likes) => "Likes",
            (_, Metric::Rating) => "Rating",
            (_, Metric::Resources) => "Resources",
        }
    }

    fn value(self, metric: Metric, stats: &Stats) -> String {
        let num = |field: &str| stats.num(field).unwrap_or(0.0);
        let is_profile = !matches!(
            self,
            Entity::ModrinthProject | Entity::CurseforgeProject | Entity::HangarProject | Entity::SpigotResource
        );
        match metric {
            Metric::Downloads if is_profile => format_number(num("totalDownloads")),
            Metric::Downloads => format_number(num("downloads")),
            Metric::Projects => js_num(num("projectCount")),
            Metric::Followers if is_profile => format_number(num("totalFollowers")),
            Metric::Followers => format_number(num("followers")),
            Metric::Versions if matches!(self, Entity::CurseforgeProject) => js_num(num("fileCount")),
            Metric::Versions => js_num(num("versionCount")),
            Metric::Rank => match stats.num("rank").filter(|r| *r != 0.0) {
                Some(rank) => format!("#{}", js_num(rank)),
                None => "N/A".into(),
            },
            Metric::Views => format_number(num("views")),
            Metric::Stars => format_number(num("totalStars")),
            Metric::Likes => format_number(num("likes")),
            Metric::Rating => {
                let field = if is_profile { "avgRating" } else { "rating" };
                match stats.num(field).filter(|r| *r != 0.0) {
                    Some(rating) => to_fixed(rating, 1),
                    None => "N/A".into(),
                }
            }
            Metric::Resources => js_num(num("resourceCount")),
        }
    }
}

#[derive(Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct BadgeQuery {
    format: Format,
    color: Option<String>,
    background_color: Option<String>,
    show_icon: bool,
    show_border: bool,
}

impl Default for BadgeQuery {
    fn default() -> Self {
        BadgeQuery {
            format: Format::Svg,
            color: None,
            background_color: None,
            show_icon: true,
            show_border: true,
        }
    }
}

fn record(state: &AppState, entity: Entity, output: Output, status: &str) {
    state
        .metrics
        .embed_requests_total
        .with_label_values(&[entity.platform().id(), "badge", entity.name(), output.label(), status])
        .inc();
}

async fn handle(
    state: SharedState,
    client: Client,
    query: BadgeQuery,
    entity: Entity,
    metric: Metric,
    id: String,
) -> Response {
    let platform = entity.platform();
    let output = Output::new(&client, query.format);
    let label = entity.label(metric);

    let cache_key = cache::badge_key(platform.id(), entity.name(), &id);
    let (data, from_cache) = match state.cache.get(&cache_key) {
        Some(CachedValue::Badge(data)) => (data, true),
        _ => match entity.fetch(&state, &id).await {
            Ok(Some(data)) => {
                let data = Arc::new(data);
                state.cache.set(cache_key, CachedValue::Badge(data.clone()));
                (data, false)
            }
            Ok(None) => {
                record(&state, entity, output, "not_found");
                let style = BadgeStyle {
                    value_color: Some("#f38ba8"),
                    show_icon: query.show_icon,
                    show_border: query.show_border,
                    ..Default::default()
                };
                return output
                    .not_found(&state, generate_badge(label, "Not found", platform, &style))
                    .await;
            }
            Err(err) => {
                record(&state, entity, output, "error");
                let style = BadgeStyle {
                    value_color: Some("#f38ba8"),
                    show_icon: query.show_icon,
                    show_border: query.show_border,
                    ..Default::default()
                };
                let svg = generate_badge(label, err.badge_text(), platform, &style);
                return output.error(&state, svg, &err).await;
            }
        },
    };

    let color = hex_color(query.color);
    let background_color = hex_color(query.background_color);
    let style = BadgeStyle {
        color: color.as_deref(),
        background_color: background_color.as_deref(),
        value_color: None,
        show_icon: query.show_icon,
        show_border: query.show_border,
    };
    let svg = generate_badge(label, &entity.value(metric, &data.stats), platform, &style);
    record(&state, entity, output, "success");
    output.success(&state, svg, from_cache, data.api_ms).await
}

fn route(entity: Entity, metric: Metric) -> MethodRouter<SharedState> {
    get(
        move |State(state): State<SharedState>,
              client: Client,
              Query(query): Query<BadgeQuery>,
              Path(id): Path<String>| { handle(state, client, query, entity, metric, id) },
    )
}

pub fn routes() -> Router<SharedState> {
    use Entity::*;
    use Metric::*;

    let badges: [(&str, Entity, Metric); 31] = [
        ("/modrinth/user/{username}/downloads", ModrinthUser, Downloads),
        ("/modrinth/user/{username}/projects", ModrinthUser, Projects),
        ("/modrinth/user/{username}/followers", ModrinthUser, Followers),
        ("/modrinth/project/{slug}/downloads", ModrinthProject, Downloads),
        ("/modrinth/project/{slug}/followers", ModrinthProject, Followers),
        ("/modrinth/project/{slug}/versions", ModrinthProject, Versions),
        ("/modrinth/organization/{id}/downloads", ModrinthOrganization, Downloads),
        ("/modrinth/organization/{id}/projects", ModrinthOrganization, Projects),
        ("/modrinth/organization/{id}/followers", ModrinthOrganization, Followers),
        ("/modrinth/collection/{id}/downloads", ModrinthCollection, Downloads),
        ("/modrinth/collection/{id}/projects", ModrinthCollection, Projects),
        ("/modrinth/collection/{id}/followers", ModrinthCollection, Followers),
        (
            "/curseforge/project/{projectId}/downloads",
            CurseforgeProject,
            Downloads,
        ),
        ("/curseforge/project/{projectId}/versions", CurseforgeProject, Versions),
        ("/curseforge/project/{projectId}/rank", CurseforgeProject, Rank),
        ("/curseforge/user/{id}/downloads", CurseforgeUser, Downloads),
        ("/curseforge/user/{id}/projects", CurseforgeUser, Projects),
        ("/curseforge/user/{id}/followers", CurseforgeUser, Followers),
        ("/hangar/project/{slug}/downloads", HangarProject, Downloads),
        ("/hangar/project/{slug}/versions", HangarProject, Versions),
        ("/hangar/project/{slug}/views", HangarProject, Views),
        ("/hangar/user/{username}/downloads", HangarUser, Downloads),
        ("/hangar/user/{username}/projects", HangarUser, Projects),
        ("/hangar/user/{username}/stars", HangarUser, Stars),
        ("/spigot/resource/{id}/downloads", SpigotResource, Downloads),
        ("/spigot/resource/{id}/likes", SpigotResource, Likes),
        ("/spigot/resource/{id}/rating", SpigotResource, Rating),
        ("/spigot/resource/{id}/versions", SpigotResource, Versions),
        ("/spigot/author/{id}/downloads", SpigotAuthor, Downloads),
        ("/spigot/author/{id}/resources", SpigotAuthor, Resources),
        ("/spigot/author/{id}/rating", SpigotAuthor, Rating),
    ];

    badges
        .into_iter()
        .fold(Router::new(), |router, (path, entity, metric)| {
            router.route(path, route(entity, metric))
        })
}
