use serde::Deserialize;
use serde::de::DeserializeOwned;

use super::nullable;
use crate::error::AppError;
use crate::platform::Platform;
use crate::upstream::{Upstream, url};

const BASE_URL: &str = "https://api.spiget.org/v2";

pub fn resource_icon_fallback_url(resource_id: i64) -> String {
    format!(
        "https://www.spigotmc.org/data/resource_icons/{}/{resource_id}.jpg",
        resource_id / 1000
    )
}

pub fn author_avatar_url(author_id: &str) -> String {
    format!("{BASE_URL}/authors/{author_id}/avatar")
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Resource {
    #[serde(default, deserialize_with = "nullable")]
    pub id: i64,
    pub name: Option<String>,
    pub tag: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub likes: f64,
    pub rating: Option<Rating>,
    pub icon: Option<Icon>,
    pub release_date: Option<i64>,
}

impl Resource {
    pub fn rating_average(&self) -> f64 {
        self.rating.as_ref().map_or(0.0, |r| r.average)
    }
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Rating {
    #[serde(default, deserialize_with = "nullable")]
    pub average: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub count: f64,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Icon {
    pub data: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Version {
    pub name: Option<String>,
    pub release_date: Option<i64>,
    #[serde(default, deserialize_with = "nullable")]
    pub downloads: f64,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Author {
    pub name: Option<String>,
    pub icon: Option<Icon>,
}

pub struct SpigotApi<'a> {
    pub upstream: &'a Upstream,
}

impl SpigotApi<'_> {
    async fn get<T: DeserializeOwned>(&self, path: &[&str], query: &[(&str, String)]) -> Result<Option<T>, AppError> {
        let url = url(BASE_URL, path);
        self.upstream
            .call(Platform::Spigot, async {
                self.upstream.get_json(Platform::Spigot, url, query).await.map(Some)
            })
            .await
    }

    pub async fn get_resource(&self, resource_id: &str) -> Result<Option<Resource>, AppError> {
        self.get(&["resources", resource_id], &[]).await
    }

    pub async fn get_resource_versions(
        &self,
        resource_id: &str,
        limit: usize,
    ) -> Result<Option<Vec<Version>>, AppError> {
        self.get(
            &["resources", resource_id, "versions"],
            &[("size", limit.to_string()), ("sort", "-releaseDate".into())],
        )
        .await
    }

    pub async fn get_author(&self, author_id: &str) -> Result<Option<Author>, AppError> {
        self.get(&["authors", author_id], &[]).await
    }

    pub async fn get_author_resources(&self, author_id: &str, limit: usize) -> Result<Option<Vec<Resource>>, AppError> {
        self.get(
            &["authors", author_id, "resources"],
            &[("size", limit.to_string()), ("sort", "-downloads".into())],
        )
        .await
    }
}
