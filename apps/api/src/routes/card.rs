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
use crate::generators::card::{CardOptions, generate_card, generate_error_card};
use crate::model::CardData;
use crate::platform::{DEFAULT_COUNT, MAX_COUNT, Platform};
use crate::platforms::{curseforge, hangar, modrinth, spigot};
use crate::state::AppState;

#[derive(Clone, Copy)]
enum CardType {
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

impl CardType {
    fn platform(self) -> Platform {
        match self {
            CardType::ModrinthUser
            | CardType::ModrinthProject
            | CardType::ModrinthOrganization
            | CardType::ModrinthCollection => Platform::Modrinth,
            CardType::CurseforgeProject | CardType::CurseforgeUser => Platform::CurseForge,
            CardType::HangarProject | CardType::HangarUser => Platform::Hangar,
            CardType::SpigotResource | CardType::SpigotAuthor => Platform::Spigot,
        }
    }

    fn entity(self) -> &'static str {
        match self {
            CardType::ModrinthUser | CardType::CurseforgeUser | CardType::HangarUser => "user",
            CardType::ModrinthProject | CardType::CurseforgeProject | CardType::HangarProject => "project",
            CardType::ModrinthOrganization => "organization",
            CardType::ModrinthCollection => "collection",
            CardType::SpigotResource => "resource",
            CardType::SpigotAuthor => "author",
        }
    }

    async fn fetch(self, state: &AppState, id: &str, project_type: Option<&str>) -> Result<Option<CardData>, AppError> {
        match self {
            CardType::ModrinthUser => modrinth::user_card(state, id, project_type).await,
            CardType::ModrinthProject => modrinth::project_card(state, id).await,
            CardType::ModrinthOrganization => modrinth::organization_card(state, id, project_type).await,
            CardType::ModrinthCollection => modrinth::collection_card(state, id).await,
            CardType::CurseforgeProject => curseforge::mod_card(state, id).await,
            CardType::CurseforgeUser => curseforge::user_card(state, id, project_type).await,
            CardType::HangarProject => hangar::project_card(state, id).await,
            CardType::HangarUser => hangar::user_card(state, id).await,
            CardType::SpigotResource => spigot::resource_card(state, id).await,
            CardType::SpigotAuthor => spigot::author_card(state, id).await,
        }
    }
}

#[derive(Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct CardQuery {
    format: Format,
    show_projects: bool,
    show_versions: bool,
    max_projects: Option<usize>,
    max_versions: Option<usize>,
    relative_time: bool,
    show_sparklines: bool,
    show_download_bars: bool,
    show_summary: bool,
    show_border: bool,
    animations: bool,
    color: Option<String>,
    background_color: Option<String>,
    project_type: Option<String>,
    legacy_domain: bool,
}

impl Default for CardQuery {
    fn default() -> Self {
        CardQuery {
            format: Format::Svg,
            show_projects: true,
            show_versions: true,
            max_projects: None,
            max_versions: None,
            relative_time: true,
            show_sparklines: true,
            show_download_bars: true,
            show_summary: false,
            show_border: true,
            animations: true,
            color: None,
            background_color: None,
            project_type: None,
            legacy_domain: false,
        }
    }
}

fn count(value: Option<usize>) -> usize {
    value.unwrap_or(DEFAULT_COUNT).clamp(1, MAX_COUNT)
}

fn record(state: &AppState, card: CardType, output: Output, status: &str) {
    state
        .metrics
        .embed_requests_total
        .with_label_values(&[card.platform().id(), "card", card.entity(), output.label(), status])
        .inc();
}

async fn handle(state: SharedState, client: Client, query: CardQuery, card: CardType, id: String) -> Response {
    let platform = card.platform();
    let output = Output::new(&client, query.format);
    let mut options = CardOptions {
        show_projects: query.show_projects,
        show_versions: query.show_versions,
        max_projects: count(query.max_projects),
        max_versions: count(query.max_versions),
        relative_time: query.relative_time,
        show_sparklines: query.show_sparklines,
        show_download_bars: query.show_download_bars,
        show_summary: query.show_summary,
        show_border: query.show_border,
        animations: !output.png && query.animations,
        color: hex_color(query.color),
        background_color: hex_color(query.background_color),
        project_type: query.project_type.filter(|t| !t.is_empty()),
        legacy_domain: client.legacy_domain || query.legacy_domain,
        from_cache: false,
    };

    let mut cache_key = cache::key(platform.id(), card.entity(), &id);
    if let Some(project_type) = &options.project_type {
        cache_key.push_str(&format!(":pt:{project_type}"));
    }

    let (data, from_cache) = match state.cache.get(&cache_key) {
        Some(CachedValue::Card(data)) => (data, true),
        _ => match card.fetch(&state, &id, options.project_type.as_deref()).await {
            Ok(Some(data)) => {
                let data = Arc::new(data);
                state.cache.set(cache_key, CachedValue::Card(data.clone()));
                (data, false)
            }
            Ok(None) => {
                record(&state, card, output, "not_found");
                let svg = generate_error_card(platform.not_found_message(card.entity()), "", platform);
                return output.not_found(&state, svg).await;
            }
            Err(err) => {
                record(&state, card, output, "error");
                return output.error(&state, platform, &err).await;
            }
        },
    };

    options.from_cache = from_cache;
    let svg = generate_card(&data, platform, data.entity_type.unwrap_or(card.entity()), &options);
    record(&state, card, output, "success");
    output.success(&state, svg, from_cache, data.api_ms).await
}

fn route(card: CardType) -> MethodRouter<SharedState> {
    get(
        move |State(state): State<SharedState>,
              client: Client,
              Query(query): Query<CardQuery>,
              Path(id): Path<String>| { handle(state, client, query, card, id) },
    )
}

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/modrinth/user/{username}", route(CardType::ModrinthUser))
        .route("/modrinth/project/{slug}", route(CardType::ModrinthProject))
        .route("/modrinth/organization/{id}", route(CardType::ModrinthOrganization))
        .route("/modrinth/collection/{id}", route(CardType::ModrinthCollection))
        .route("/curseforge/project/{projectId}", route(CardType::CurseforgeProject))
        .route("/curseforge/user/{id}", route(CardType::CurseforgeUser))
        .route("/hangar/project/{slug}", route(CardType::HangarProject))
        .route("/hangar/user/{username}", route(CardType::HangarUser))
        .route("/spigot/resource/{id}", route(CardType::SpigotResource))
        .route("/spigot/author/{id}", route(CardType::SpigotAuthor))
}
