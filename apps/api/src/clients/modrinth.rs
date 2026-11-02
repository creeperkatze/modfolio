use serde::Deserialize;
use serde::de::DeserializeOwned;

use super::nullable;
use crate::error::AppError;
use crate::platform::Platform;
use crate::upstream::{Upstream, url};

const BASE_URL: &str = "https://api.modrinth.com";

#[derive(Deserialize, Clone, Debug, Default)]
pub struct User {
    #[serde(default, deserialize_with = "nullable")]
    pub username: String,
    pub name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct ProjectV2 {
    #[serde(default, deserialize_with = "nullable")]
    pub id: String,
    pub title: Option<String>,
    pub project_type: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub followers: f64,
    pub icon_url: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub loaders: Vec<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct ProjectV3 {
    #[serde(default, deserialize_with = "nullable")]
    pub id: String,
    pub name: Option<String>,
    pub summary: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub project_types: Vec<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub followers: f64,
    pub icon_url: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub loaders: Vec<String>,
    pub minecraft_java_server: Option<JavaServer>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct JavaServer {
    pub ping: Option<Ping>,
    pub verified_plays_2w: Option<f64>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Ping {
    pub data: Option<PingData>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct PingData {
    pub players_online: Option<f64>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct VersionV3 {
    pub name: Option<String>,
    pub version_number: Option<String>,
    pub date_published: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub loaders: Vec<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub game_versions: Vec<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Organization {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon_url: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Collection {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub projects: Vec<String>,
}

pub struct ModrinthApi<'a> {
    pub upstream: &'a Upstream,
}

impl ModrinthApi<'_> {
    async fn get<T: DeserializeOwned>(&self, path: &[&str], query: &[(&str, String)]) -> Result<Option<T>, AppError> {
        let url = url(BASE_URL, path);
        self.upstream
            .call(Platform::Modrinth, async {
                self.upstream.get_json(Platform::Modrinth, url, query).await.map(Some)
            })
            .await
    }

    pub async fn user(&self, username: &str) -> Result<Option<User>, AppError> {
        self.get(&["v2", "user", username], &[]).await
    }

    pub async fn user_projects(&self, username: &str) -> Result<Option<Vec<ProjectV2>>, AppError> {
        self.get(&["v2", "user", username, "projects"], &[]).await
    }

    pub async fn project_v3(&self, slug: &str) -> Result<Option<ProjectV3>, AppError> {
        self.get(&["v3", "project", slug], &[]).await
    }

    pub async fn project_versions(&self, slug: &str) -> Result<Option<Vec<VersionV3>>, AppError> {
        self.get(
            &["v3", "project", slug, "version"],
            &[("include_changelog", "false".into())],
        )
        .await
    }

    pub async fn organization(&self, id: &str) -> Result<Option<Organization>, AppError> {
        self.get(&["v3", "organization", id], &[]).await
    }

    pub async fn organization_projects(&self, id: &str) -> Result<Option<Vec<ProjectV3>>, AppError> {
        self.get(&["v3", "organization", id, "projects"], &[]).await
    }

    pub async fn collection(&self, id: &str) -> Result<Option<Collection>, AppError> {
        self.get(&["v3", "collection", id], &[]).await
    }

    pub async fn projects(&self, ids: &[String]) -> Result<Option<Vec<ProjectV2>>, AppError> {
        let ids = serde_json::to_string(ids).unwrap_or_else(|_| "[]".into());
        self.get(&["v2", "projects"], &[("ids", ids)]).await
    }
}
