use axum::extract::{Path, Query, State};
use axum::http::{StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use super::SharedState;
use crate::cache::{self, CachedValue};
use crate::clients::curseforge::CurseforgeApi;
use crate::clients::hangar::HangarApi;
use crate::clients::modrinth::ModrinthApi;
use crate::clients::numeric_id;
use crate::clients::spigot::SpigotApi;
use crate::error::AppError;
use crate::model::non_empty;
use crate::state::AppState;

const CACHE_CONTROL: (header::HeaderName, &str) = (header::CACHE_CONTROL, "public, max-age=3600");

#[derive(Serialize)]
struct Meta {
    name: Option<String>,
    url: Option<String>,
}

fn not_found(entity: &str) -> Response {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "error": format!("{entity} not found") })),
    )
        .into_response()
}

fn bad_request(message: &str) -> Response {
    (StatusCode::BAD_REQUEST, Json(json!({ "error": message }))).into_response()
}

async fn cached(
    state: &AppState,
    key: String,
    entity: &str,
    resolve: impl Future<Output = Result<Option<Meta>, AppError>>,
) -> Result<Response, AppError> {
    if let Some(CachedValue::Json(value)) = state.cache.get(&key) {
        return Ok(([CACHE_CONTROL], Json(value)).into_response());
    }
    let Some(meta) = resolve.await? else {
        return Ok(not_found(entity));
    };
    let value = json!(meta);
    state.cache.set(key, CachedValue::Json(value.clone()));
    Ok(([CACHE_CONTROL], Json(value)).into_response())
}

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
enum ModrinthKind {
    User,
    Project,
    Organization,
    Collection,
}

impl ModrinthKind {
    fn name(self) -> &'static str {
        match self {
            ModrinthKind::User => "user",
            ModrinthKind::Project => "project",
            ModrinthKind::Organization => "organization",
            ModrinthKind::Collection => "collection",
        }
    }
}

async fn modrinth_meta(
    State(state): State<SharedState>,
    Path((kind, id)): Path<(ModrinthKind, String)>,
) -> Result<Response, AppError> {
    let api = ModrinthApi {
        upstream: &state.upstream,
    };
    let resolve = async {
        Ok(match kind {
            ModrinthKind::User => api.user(&id).await?.map(|user| Meta {
                name: Some(user.username),
                url: Some(format!("https://modrinth.com/user/{id}")),
            }),
            ModrinthKind::Project => api.project_v3(&id).await?.map(|project| {
                let segment = match project.project_types.first().map(String::as_str) {
                    Some("minecraft_java_server" | "minecraft_bedrock_server") => "server",
                    Some(project_type) => project_type,
                    None => "project",
                };
                Meta {
                    url: Some(format!("https://modrinth.com/{segment}/{id}")),
                    name: project.name,
                }
            }),
            ModrinthKind::Organization => api.organization(&id).await?.map(|org| Meta {
                name: org.name,
                url: Some(format!("https://modrinth.com/organization/{id}")),
            }),
            ModrinthKind::Collection => api.collection(&id).await?.map(|collection| Meta {
                name: collection.name,
                url: Some(format!("https://modrinth.com/collection/{id}")),
            }),
        })
    };
    let key = cache::meta_key("modrinth", kind.name(), &id);
    cached(&state, key, kind.name(), resolve).await
}

#[derive(Deserialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
enum CurseforgeKind {
    Project,
    User,
}

/// Cached because CurseForge has no endpoint to look up a username by id.
async fn curseforge_username(state: &AppState, user_id: &str) -> Result<Option<String>, AppError> {
    let key = cache::key("curseforge", "userIdLookup", user_id);
    if let Some(CachedValue::Json(Value::String(username))) = state.cache.get(&key) {
        return Ok(Some(username));
    }
    let username = CurseforgeApi {
        upstream: &state.upstream,
    }
    .username_from_user_id(user_id)
    .await?;
    if let Some(username) = &username {
        state.cache.set(key, CachedValue::Json(Value::String(username.clone())));
    }
    Ok(username)
}

async fn curseforge_meta(
    State(state): State<SharedState>,
    Path((kind, id)): Path<(CurseforgeKind, String)>,
) -> Result<Response, AppError> {
    let Some(id) = numeric_id(&id) else {
        return Ok(bad_request("id must be a number"));
    };
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let entity = match kind {
        CurseforgeKind::Project => "project",
        CurseforgeKind::User => "user",
    };
    let resolve = async {
        match kind {
            CurseforgeKind::User => {
                let Some(user) = api.get_user(&id).await? else {
                    return Ok(None);
                };
                let url = curseforge_username(&state, &id)
                    .await?
                    .map(|username| format!("https://www.curseforge.com/members/{username}"));
                Ok(Some(Meta {
                    name: non_empty(user.display_name.as_deref()),
                    url,
                }))
            }
            CurseforgeKind::Project => Ok(api.get_mod(&id).await?.map(|m| Meta {
                name: non_empty(m.name.as_deref()),
                url: m.links.and_then(|l| non_empty(l.website_url.as_deref())),
            })),
        }
    };
    cached(&state, cache::meta_key("curseforge", entity, &id), entity, resolve).await
}

async fn curseforge_slug_lookup(
    State(state): State<SharedState>,
    Path(slug): Path<String>,
) -> Result<Response, AppError> {
    let key = cache::key("curseforge", "slug", &slug);
    if let Some(CachedValue::Json(id)) = state.cache.get(&key) {
        return Ok(Json(json!({ "id": id })).into_response());
    }
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let Some(id) = api.search_mod_by_slug(&slug).await? else {
        return Ok(not_found("project"));
    };
    state.cache.set(key, CachedValue::Json(json!(id)));
    Ok(Json(json!({ "id": id })).into_response())
}

async fn curseforge_user_lookup(
    State(state): State<SharedState>,
    Path(username): Path<String>,
) -> Result<Response, AppError> {
    if let Some(id) = numeric_id(&username) {
        return Ok(Json(json!({ "id": id })).into_response());
    }

    let key = cache::key("curseforge", "userLookup", &username);
    if let Some(CachedValue::Json(id)) = state.cache.get(&key) {
        return Ok(Json(json!({ "id": id })).into_response());
    }
    let api = CurseforgeApi {
        upstream: &state.upstream,
    };
    let Some(user_id) = api.user_id_from_username(&username).await? else {
        return Ok(not_found("user"));
    };
    state.cache.set(key, CachedValue::Json(json!(user_id)));
    // Reverse mapping for profile URLs.
    state.cache.set(
        cache::key("curseforge", "userIdLookup", &user_id),
        CachedValue::Json(json!(username)),
    );
    Ok(Json(json!({ "id": user_id })).into_response())
}

#[derive(Deserialize, Clone, Copy, Default)]
#[serde(rename_all = "lowercase")]
enum HangarKind {
    #[default]
    Project,
    User,
}

#[derive(Deserialize)]
struct HangarMetaQuery {
    #[serde(rename = "type", default)]
    kind: HangarKind,
}

async fn hangar_meta(
    State(state): State<SharedState>,
    Path(slug): Path<String>,
    Query(query): Query<HangarMetaQuery>,
) -> Result<Response, AppError> {
    let api = HangarApi {
        upstream: &state.upstream,
        owners: &state.hangar_owners,
    };
    let entity = match query.kind {
        HangarKind::Project => "project",
        HangarKind::User => "user",
    };
    let resolve = async {
        Ok(match query.kind {
            HangarKind::User => api.get_user(&slug).await?.map(|user| Meta {
                name: non_empty(user.name.as_deref()),
                url: Some(format!("https://hangar.papermc.io/{slug}/")),
            }),
            HangarKind::Project => api.get_project(&slug).await?.map(|project| {
                let owner = project.namespace.as_ref().and_then(|ns| non_empty(ns.owner.as_deref()));
                Meta {
                    url: Some(format!(
                        "https://hangar.papermc.io/{}/{slug}/",
                        owner.as_deref().unwrap_or(&slug)
                    )),
                    name: non_empty(project.name.as_deref()),
                }
            }),
        })
    };
    cached(&state, cache::meta_key("hangar", entity, &slug), entity, resolve).await
}

#[derive(Deserialize, Clone, Copy, Default)]
#[serde(rename_all = "lowercase")]
enum SpigotKind {
    #[default]
    Resource,
    Author,
}

#[derive(Deserialize)]
struct SpigotMetaQuery {
    #[serde(rename = "type", default)]
    kind: SpigotKind,
}

async fn spigot_meta(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Query(query): Query<SpigotMetaQuery>,
) -> Result<Response, AppError> {
    let Some(id) = numeric_id(&id) else {
        return Ok(bad_request("id must be a number"));
    };
    let api = SpigotApi {
        upstream: &state.upstream,
    };
    let entity = match query.kind {
        SpigotKind::Resource => "resource",
        SpigotKind::Author => "author",
    };
    let resolve = async {
        Ok(match query.kind {
            SpigotKind::Author => api.get_author(&id).await?.map(|author| {
                let name = non_empty(author.name.as_deref());
                Meta {
                    url: Some(format!(
                        "https://www.spigotmc.org/resources/authors/{}.{id}/",
                        name.as_deref().unwrap_or(&id)
                    )),
                    name,
                }
            }),
            SpigotKind::Resource => api.get_resource(&id).await?.map(|resource| Meta {
                name: non_empty(resource.name.as_deref()),
                url: Some(format!("https://www.spigotmc.org/resources/{id}/")),
            }),
        })
    };
    cached(&state, cache::meta_key("spigot", entity, &id), entity, resolve).await
}

pub fn routes() -> Router<SharedState> {
    Router::new()
        .route("/modrinth/meta/{type}/{id}", get(modrinth_meta))
        .route("/curseforge/meta/{type}/{id}", get(curseforge_meta))
        .route("/curseforge/lookup/{slug}", get(curseforge_slug_lookup))
        .route("/curseforge/lookup/user/{username}", get(curseforge_user_lookup))
        .route("/hangar/meta/{slug}", get(hangar_meta))
        .route("/spigot/meta/{id}", get(spigot_meta))
}
