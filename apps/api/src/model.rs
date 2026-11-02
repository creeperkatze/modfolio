use crate::format::format_number;

#[derive(Clone, Debug)]
pub enum Stat {
    Num(f64),
    /// Pre-formatted value that is shown as is.
    Text(String),
}

impl Stat {
    pub fn display(&self) -> String {
        match self {
            Stat::Num(n) => format_number(*n),
            Stat::Text(text) => text.clone(),
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Stats(Vec<(&'static str, Stat)>);

impl Stats {
    pub fn with(mut self, field: &'static str, value: impl Into<Option<f64>>) -> Self {
        if let Some(value) = value.into() {
            self.0.push((field, Stat::Num(value)));
        }
        self
    }

    pub fn with_text(mut self, field: &'static str, value: String) -> Self {
        self.0.push((field, Stat::Text(value)));
        self
    }

    pub fn get(&self, field: &str) -> Option<&Stat> {
        self.0.iter().find(|(k, _)| *k == field).map(|(_, v)| v)
    }

    pub fn num(&self, field: &str) -> Option<f64> {
        match self.get(field) {
            Some(Stat::Num(n)) => Some(*n),
            _ => None,
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct VersionItem {
    pub version_number: String,
    pub date: Option<String>,
    pub loaders: Vec<String>,
    pub game_versions: Vec<String>,
    pub downloads: f64,
}

#[derive(Clone, Debug, Default)]
pub struct ProjectItem {
    pub id: String,
    pub title: String,
    pub downloads: f64,
    pub followers: f64,
    /// Data URI, or the remote logo URL on CurseForge.
    pub icon: Option<String>,
    pub icon_url: Option<String>,
    pub project_type: String,
    pub loaders: Vec<String>,
    pub version_dates: Vec<String>,
}

#[derive(Clone, Debug, Default)]
pub struct CardData {
    pub name: Option<String>,
    pub summary: Option<String>,
    pub image: Option<String>,
    pub project_type: Option<String>,
    pub class_id: Option<i64>,
    pub versions: Vec<VersionItem>,
    pub projects: Vec<ProjectItem>,
    pub stats: Stats,
    pub all_version_dates: Vec<String>,
    /// Set for Modrinth servers.
    pub entity_type: Option<&'static str>,
    pub api_ms: f64,
}

#[derive(Clone, Debug, Default)]
pub struct BadgeData {
    pub stats: Stats,
    pub api_ms: f64,
}

/// Treats empty strings as missing, like JS `||`.
pub fn non_empty(value: Option<&str>) -> Option<String> {
    value.filter(|s| !s.is_empty()).map(str::to_string)
}
