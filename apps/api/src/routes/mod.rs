mod badge;
mod card;
mod embed;
mod meta;

use std::sync::Arc;
use std::time::Instant;

use axum::extract::{MatchedPath, Request, State};
use axum::handler::HandlerWithoutStateExt;
use axum::http::{HeaderMap, StatusCode, header};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use serde_json::json;
use subtle::ConstantTimeEq;
use tower_http::services::ServeDir;
use tower_http::trace::{DefaultMakeSpan, DefaultOnResponse, TraceLayer};
use tracing::Level;

use crate::state::AppState;

pub type SharedState = Arc<AppState>;

async fn track_metrics(State(state): State<SharedState>, request: Request, next: Next) -> Response {
    let start = Instant::now();
    let method = request.method().to_string();
    let route = request
        .extensions()
        .get::<MatchedPath>()
        .map_or_else(String::new, |path| path.as_str().to_string());
    let crawler = request
        .headers()
        .get(header::USER_AGENT)
        .and_then(|v| v.to_str().ok())
        .and_then(embed::crawler);

    let response = next.run(request).await;

    let metrics = &state.metrics;
    let status = response.status().as_u16().to_string();
    metrics
        .http_requests_total
        .with_label_values(&[&method, &route, &status])
        .inc();
    metrics
        .http_request_duration_seconds
        .with_label_values(&[&method, &route])
        .observe(start.elapsed().as_secs_f64());
    if let Some(crawler) = crawler {
        metrics.crawler_requests_total.with_label_values(&[crawler]).inc();
    }
    response
}

async fn metrics(State(state): State<SharedState>, headers: HeaderMap) -> Response {
    let provided = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    let authorized = match (&state.config.metrics_token, provided) {
        (Some(expected), Some(provided)) => bool::from(provided.as_bytes().ct_eq(expected.as_bytes())),
        _ => false,
    };
    if !authorized {
        return (StatusCode::UNAUTHORIZED, Json(json!({ "error": "unauthorized" }))).into_response();
    }

    let (body, content_type) = state.metrics.encode();
    ([(header::CONTENT_TYPE, content_type)], body).into_response()
}

async fn not_found() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, Json(json!({ "error": "not found" })))
}

pub fn router(state: SharedState) -> Router {
    let api = Router::new()
        .merge(card::routes())
        .merge(badge::routes())
        .merge(meta::routes())
        .route_layer(middleware::from_fn_with_state(state.clone(), track_metrics));

    // Built frontend first, then the API's own assets.
    let static_files = ServeDir::new(&state.config.web_dist_dir)
        .fallback(ServeDir::new(&state.config.public_dir).fallback(not_found.into_service()));

    api.route("/metrics", get(metrics))
        .fallback_service(static_files)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                .on_response(DefaultOnResponse::new().level(Level::INFO)),
        )
        .with_state(state)
}
