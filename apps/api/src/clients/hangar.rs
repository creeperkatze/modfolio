use std::collections::HashMap;
use std::sync::Mutex;

use serde::Deserialize;
use serde::de::DeserializeOwned;
use serde_json::{Map, Value};

use super::nullable;
use crate::error::AppError;
use crate::platform::Platform;
use crate::upstream::{FetchError, Upstream, url};

const BASE_URL: &str = "https://hangar.papermc.io/api/v1";

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub name: Option<String>,
    pub namespace: Option<Namespace>,
    pub stats: Option<ProjectStats>,
    pub avatar_url: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

impl Project {
    pub fn stats(&self) -> ProjectStats {
        self.stats.clone().unwrap_or_default()
    }
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Namespace {
    pub owner: Option<String>,
    pub slug: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct ProjectStats {
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub views: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub stars: f64,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Version {
    pub name: Option<String>,
    pub created_at: Option<String>,
    pub stats: Option<VersionStats>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: Map<String, Value>,
    #[serde(default, deserialize_with = "nullable")]
    pub platform_dependencies: Map<String, Value>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct VersionStats {
    #[serde(default, deserialize_with = "nullable")]
    pub total_downloads: f64,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub name: Option<String>,
    pub tagline: Option<String>,
    pub avatar_url: Option<String>,
    pub project_count: Option<f64>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(bound(deserialize = "T: Deserialize<'de>"))]
pub struct List<T> {
    #[serde(default, deserialize_with = "nullable")]
    pub result: Vec<T>,
    pub pagination: Option<Pagination>,
}

impl<T> List<T> {
    pub fn count(&self) -> Option<f64> {
        self.pagination.as_ref().and_then(|p| p.count)
    }
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Pagination {
    pub count: Option<f64>,
}

/// Routes only have the slug, so project owners are looked up once and cached.
pub struct HangarApi<'a> {
    pub upstream: &'a Upstream,
    pub owners: &'a Mutex<HashMap<String, String>>,
}

impl HangarApi<'_> {
    async fn fetch<T: DeserializeOwned>(&self, path: &[&str], query: &[(&str, String)]) -> Result<T, FetchError> {
        self.upstream
            .get_json(Platform::Hangar, url(BASE_URL, path), query)
            .await
    }

    async fn resolve_owner(&self, slug: &str) -> Result<Option<String>, FetchError> {
        if let Some(owner) = self.owners.lock().unwrap_or_else(|e| e.into_inner()).get(slug) {
            return Ok(Some(owner.clone()));
        }

        let results: List<Project> = self
            .fetch(&["projects"], &[("query", slug.to_string()), ("limit", "5".into())])
            .await?;
        let owner = results
            .result
            .iter()
            .filter_map(|p| p.namespace.as_ref())
            .find(|ns| {
                ns.slug
                    .as_deref()
                    .is_some_and(|s| s.to_lowercase() == slug.to_lowercase())
            })
            .and_then(|ns| ns.owner.clone());

        if let Some(owner) = &owner {
            self.owners
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .insert(slug.to_string(), owner.clone());
        }
        Ok(owner)
    }

    pub async fn get_project(&self, slug: &str) -> Result<Option<Project>, AppError> {
        self.upstream
            .call(Platform::Hangar, async {
                let Some(owner) = self.resolve_owner(slug).await? else {
                    return Ok(None);
                };
                self.fetch(&["projects", &owner, slug], &[]).await.map(Some)
            })
            .await
    }

    pub async fn get_project_versions(&self, slug: &str, limit: usize) -> Result<Option<List<Version>>, AppError> {
        self.upstream
            .call(Platform::Hangar, async {
                let Some(owner) = self.resolve_owner(slug).await? else {
                    return Ok(None);
                };
                self.fetch(&["projects", &owner, slug, "versions"], &[("limit", limit.to_string())])
                    .await
                    .map(Some)
            })
            .await
    }

    pub async fn get_user(&self, username: &str) -> Result<Option<User>, AppError> {
        self.upstream
            .call(Platform::Hangar, async {
                self.fetch(&["users", username], &[]).await.map(Some)
            })
            .await
    }

    pub async fn get_user_projects(&self, username: &str, limit: usize) -> Result<Option<List<Project>>, AppError> {
        self.upstream
            .call(Platform::Hangar, async {
                self.fetch(
                    &["projects"],
                    &[("owner", username.to_string()), ("limit", limit.to_string())],
                )
                .await
                .map(Some)
            })
            .await
    }
}
