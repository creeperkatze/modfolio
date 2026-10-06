use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::cache::Cache;
use crate::metrics::Metrics;
use crate::render::Renderer;
use crate::upstream::Upstream;

const API_CACHE_TTL: Duration = Duration::from_secs(60 * 60);

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub user_agent: String,
    pub curseforge_api_key: Option<String>,
    pub metrics_token: Option<String>,
    pub public_dir: PathBuf,
    pub web_dist_dir: PathBuf,
}

fn env(name: &str) -> Option<String> {
    std::env::var(name).ok().filter(|v| !v.is_empty())
}

impl Config {
    pub fn from_env() -> Self {
        Config {
            port: env("PORT").and_then(|p| p.parse().ok()).unwrap_or(3000),
            user_agent: env("USER_AGENT")
                .map(|ua| ua.replace("{version}", crate::VERSION))
                .unwrap_or_else(|| format!("modfolio/{}", crate::VERSION)),
            curseforge_api_key: env("CURSEFORGE_API_KEY"),
            metrics_token: env("METRICS_TOKEN"),
            public_dir: env("PUBLIC_DIR").unwrap_or_else(|| "public".into()).into(),
            web_dist_dir: env("WEB_DIST_DIR").unwrap_or_else(|| "../web/dist".into()).into(),
        }
    }
}

pub struct AppState {
    pub config: Config,
    pub metrics: Arc<Metrics>,
    pub cache: Cache,
    pub upstream: Upstream,
    pub renderer: Renderer,
    pub hangar_owners: Mutex<HashMap<String, String>>,
}

impl AppState {
    pub fn new(config: Config) -> Arc<Self> {
        let metrics = Arc::new(Metrics::new());
        Arc::new(AppState {
            cache: Cache::new(API_CACHE_TTL, metrics.clone()),
            upstream: Upstream::new(
                config.user_agent.clone(),
                config.curseforge_api_key.clone(),
                metrics.clone(),
            ),
            renderer: Renderer::new(&config.public_dir.join("fonts"), metrics.clone()),
            hangar_owners: Mutex::new(HashMap::new()),
            metrics,
            config,
        })
    }
}
