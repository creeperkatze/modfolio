pub mod cache;
pub mod clients;
pub mod error;
pub mod format;
pub mod generators;
pub mod icons;
pub mod image;
pub mod metrics;
pub mod model;
pub mod platform;
pub mod platforms;
pub mod render;
pub mod routes;
pub mod state;
pub mod upstream;

pub use state::{AppState, Config};

pub const VERSION: &str = env!("MODFOLIO_VERSION");

pub fn app(state: std::sync::Arc<AppState>) -> axum::Router {
    routes::router(state)
}
