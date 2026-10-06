use serde::Deserialize;
use serde::de::DeserializeOwned;

use super::nullable;
use crate::error::AppError;
use crate::platform::Platform;
use crate::upstream::{FetchError, Upstream, url};

const BASE_URL: &str = "https://api.curseforge.com";
const MINECRAFT_GAME_ID: &str = "432";

pub const SORT_POPULARITY: u8 = 2;
pub const SORT_TOTAL_DOWNLOADS: u8 = 6;

const KNOWN_LOADERS: [&str; 12] = [
    "Forge",
    "Fabric",
    "NeoForge",
    "Quilt",
    "Rift",
    "LiteLoader",
    "Cauldron",
    "ModLoader",
    "Canvas",
    "Iris",
    "OptiFine",
    "Sodium",
];

// Tags in gameVersions that are not game versions.
const FILTERED_TAGS: [&str; 4] = ["Client", "Server", "Singleplayer", "Java"];

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Mod {
    #[serde(default, deserialize_with = "nullable")]
    pub id: i64,
    pub name: Option<String>,
    pub summary: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub download_count: f64,
    pub game_popularity_rank: Option<f64>,
    pub logo: Option<Logo>,
    pub class_id: Option<i64>,
    pub links: Option<Links>,
    #[serde(default, deserialize_with = "nullable")]
    pub authors: Vec<Author>,
    #[serde(default, deserialize_with = "nullable")]
    pub latest_files: Vec<File>,
}

impl Mod {
    pub fn logo_url(&self) -> Option<&str> {
        self.logo.as_ref().and_then(|l| l.url.as_deref())
    }
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Logo {
    pub url: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Links {
    pub website_url: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
pub struct Author {
    pub id: Option<i64>,
    pub name: Option<String>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub display_name: Option<String>,
    pub file_name: Option<String>,
    pub file_date: Option<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub download_count: f64,
    #[serde(default, deserialize_with = "nullable")]
    pub game_versions: Vec<String>,
    #[serde(default, deserialize_with = "nullable")]
    pub sortable_game_versions: Vec<SortableGameVersion>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct SortableGameVersion {
    pub game_version_type_id: Option<i64>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub mods_download_count: Option<f64>,
    pub follower_count: Option<f64>,
}

#[derive(Deserialize)]
struct Data<T> {
    data: T,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(bound(deserialize = "T: Deserialize<'de>"))]
pub struct Paged<T> {
    #[serde(default, deserialize_with = "nullable")]
    pub data: Vec<T>,
    pub pagination: Option<Pagination>,
}

impl<T> Paged<T> {
    pub fn total_count(&self) -> Option<f64> {
        self.pagination.as_ref().and_then(|p| p.total_count)
    }
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct Pagination {
    pub total_count: Option<f64>,
}

pub fn extract_loaders(file: &File) -> Vec<String> {
    // NeoForge is sometimes only listed in sortableGameVersions.
    let from_type_id = file
        .sortable_game_versions
        .iter()
        .filter(|v| v.game_version_type_id == Some(68441))
        .map(|_| "NeoForge");
    let from_game_versions = file
        .game_versions
        .iter()
        .map(String::as_str)
        .filter(|v| KNOWN_LOADERS.contains(v));
    let mut loaders: Vec<String> = Vec::new();
    for loader in from_type_id.chain(from_game_versions) {
        if !loaders.iter().any(|l| l == loader) {
            loaders.push(loader.to_string());
        }
    }
    loaders
}

pub fn extract_game_versions(file: &File) -> Vec<String> {
    file.game_versions
        .iter()
        .filter(|v| !KNOWN_LOADERS.contains(&v.as_str()) && !FILTERED_TAGS.contains(&v.as_str()))
        .cloned()
        .collect()
}

pub fn file_date_ms(file: &File) -> f64 {
    file.file_date
        .as_deref()
        .and_then(crate::format::parse_date_ms)
        .map_or(f64::NAN, |ms| ms as f64)
}

/// latestFiles is not sorted by date.
pub fn latest_file(files: &[File]) -> Option<&File> {
    let mut latest = files.first()?;
    for file in &files[1..] {
        if file_date_ms(file) > file_date_ms(latest) {
            latest = file;
        }
    }
    Some(latest)
}

#[derive(Default)]
pub struct SearchOptions {
    pub author_id: Option<String>,
    pub search_filter: Option<String>,
    pub slug: Option<String>,
    pub class_id: Option<String>,
    pub page_size: Option<u32>,
    pub sort_field: Option<u8>,
    pub sort_order: Option<&'static str>,
}

// CurseForge has no endpoint for a user's projects.
pub struct CurseforgeApi<'a> {
    pub upstream: &'a Upstream,
}

impl CurseforgeApi<'_> {
    async fn fetch<T: DeserializeOwned>(&self, path: &[&str], query: &[(&str, String)]) -> Result<T, FetchError> {
        self.upstream
            .get_json(Platform::CurseForge, url(BASE_URL, path), query)
            .await
    }

    pub async fn get_mod(&self, mod_id: &str) -> Result<Option<Mod>, AppError> {
        self.upstream
            .call(Platform::CurseForge, async {
                self.fetch::<Data<Mod>>(&["v1", "mods", mod_id], &[])
                    .await
                    .map(|d| Some(d.data))
            })
            .await
    }

    pub async fn get_mod_files(&self, mod_id: &str, page_size: usize) -> Result<Option<Paged<File>>, AppError> {
        self.upstream
            .call(Platform::CurseForge, async {
                self.fetch(&["v1", "mods", mod_id, "files"], &[("pageSize", page_size.to_string())])
                    .await
                    .map(Some)
            })
            .await
    }

    pub async fn get_user(&self, user_id: &str) -> Result<Option<User>, AppError> {
        self.upstream
            .call(Platform::CurseForge, async {
                self.fetch::<Data<User>>(&["v1", "users", user_id], &[])
                    .await
                    .map(|d| Some(d.data))
            })
            .await
    }

    pub async fn search_mods(&self, options: SearchOptions) -> Result<Paged<Mod>, AppError> {
        let mut query = vec![("gameId", MINECRAFT_GAME_ID.to_string())];
        if let Some(v) = options.author_id {
            query.push(("authorId", v));
        }
        if let Some(v) = options.search_filter {
            query.push(("searchFilter", v));
        }
        if let Some(v) = options.slug {
            query.push(("slug", v));
        }
        if let Some(v) = options.class_id {
            query.push(("classId", v));
        }
        if let Some(v) = options.page_size {
            query.push(("pageSize", v.to_string()));
        }
        if let Some(v) = options.sort_field {
            query.push(("sortField", v.to_string()));
        }
        if let Some(v) = options.sort_order {
            query.push(("sortOrder", v.to_string()));
        }
        self.fetch(&["v1", "mods", "search"], &query)
            .await
            .map_err(|err| err.into_app_error(Platform::CurseForge))
    }

    pub async fn search_mod_by_slug(&self, slug: &str) -> Result<Option<i64>, AppError> {
        let response = self
            .search_mods(SearchOptions {
                slug: Some(slug.to_string()),
                ..Default::default()
            })
            .await?;
        Ok(response.data.first().map(|m| m.id))
    }

    pub async fn user_id_from_username(&self, username: &str) -> Result<Option<String>, AppError> {
        let response = self
            .search_mods(SearchOptions {
                search_filter: Some(username.to_string()),
                page_size: Some(50),
                sort_field: Some(SORT_POPULARITY),
                sort_order: Some("desc"),
                ..Default::default()
            })
            .await?;

        let normalize = |name: &str| -> String {
            name.to_lowercase()
                .chars()
                .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
                .collect()
        };
        let target = username.to_lowercase();
        let normalized_target = normalize(username);
        let exact = |name: &str| name.to_lowercase() == target;
        let loose = |name: &str| exact(name) || normalize(name) == normalized_target;

        for matcher in [&exact as &dyn Fn(&str) -> bool, &loose] {
            for m in &response.data {
                let author = m
                    .authors
                    .iter()
                    .find(|a| a.name.as_deref().is_some_and(|n| !n.is_empty() && matcher(n)));
                if let Some(id) = author.and_then(|a| a.id).filter(|id| *id != 0) {
                    return Ok(Some(id.to_string()));
                }
            }
        }
        Ok(None)
    }

    pub async fn username_from_user_id(&self, user_id: &str) -> Result<Option<String>, AppError> {
        let response = self
            .search_mods(SearchOptions {
                author_id: Some(user_id.to_string()),
                page_size: Some(1),
                ..Default::default()
            })
            .await?;
        Ok(response
            .data
            .first()
            .and_then(|m| {
                m.authors
                    .iter()
                    .find(|a| a.id.map(|id| id.to_string()).as_deref() == Some(user_id))
            })
            .and_then(|a| a.name.clone())
            .filter(|n| !n.is_empty()))
    }
}
