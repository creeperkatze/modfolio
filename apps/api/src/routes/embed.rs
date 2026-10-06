use std::convert::Infallible;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::{HeaderMap, HeaderName, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use serde::Deserialize;

use crate::error::AppError;
use crate::state::AppState;

// These crawlers need PNG images.
const IMAGE_CRAWLERS: [&str; 8] = [
    "Discordbot",
    "Twitterbot",
    "facebookexternalhit",
    "Slackbot",
    "TelegramBot",
    "WhatsApp",
    "LinkedInBot",
    "SkypeUriPreview",
];

// Only counted in metrics.
const OTHER_CRAWLERS: [&str; 5] = ["github-camo", "Dropbox", "FacebookBot", "GoogleBot", "BingBot"];

const LEGACY_HOSTNAME: &str = "modfolio.creeperkatze.de";

const CACHE_MAX_AGE_SECONDS: u32 = 3600;

#[derive(Deserialize, Clone, Copy, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    #[default]
    Svg,
    Png,
}

pub fn crawler(user_agent: &str) -> Option<&'static str> {
    IMAGE_CRAWLERS
        .iter()
        .chain(OTHER_CRAWLERS.iter())
        .find(|c| user_agent.contains(*c))
        .copied()
}

pub fn is_legacy_host(host: &str) -> bool {
    host.split(':')
        .next()
        .unwrap_or_default()
        .eq_ignore_ascii_case(LEGACY_HOSTNAME)
}

pub struct Client {
    pub image_crawler: bool,
    pub legacy_domain: bool,
}

impl<S: Send + Sync> FromRequestParts<S> for Client {
    type Rejection = Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let header = |name| {
            parts
                .headers
                .get(name)
                .and_then(|v| v.to_str().ok())
                .unwrap_or_default()
        };
        let user_agent = header(header::USER_AGENT);
        Ok(Client {
            image_crawler: IMAGE_CRAWLERS.iter().any(|c| user_agent.contains(c)),
            legacy_domain: is_legacy_host(header(header::HOST)),
        })
    }
}

pub fn hex_color(value: Option<String>) -> Option<String> {
    value
        .map(|v| v.trim_start_matches('#').to_string())
        .filter(|v| !v.is_empty())
        .map(|v| format!("#{v}"))
}

/// How an embed is delivered: PNG for crawlers and `format=png`, SVG otherwise.
#[derive(Clone, Copy)]
pub struct Output {
    pub png: bool,
    image_crawler: bool,
}

impl Output {
    pub fn new(client: &Client, format: Format) -> Self {
        Output {
            png: client.image_crawler || format == Format::Png,
            image_crawler: client.image_crawler,
        }
    }

    pub fn label(self) -> &'static str {
        if self.png { "png" } else { "svg" }
    }

    pub async fn success(self, state: &AppState, svg: String, from_cache: bool, api_ms: f64) -> Response {
        let mut headers = HeaderMap::new();
        headers.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_str(&format!("public, max-age={CACHE_MAX_AGE_SECONDS}")).expect("valid header"),
        );
        headers.insert(
            HeaderName::from_static("x-cache"),
            HeaderValue::from_static(if from_cache { "HIT" } else { "MISS" }),
        );
        if !from_cache {
            headers.insert(
                HeaderName::from_static("x-api-time"),
                HeaderValue::from_str(&format!("{}ms", api_ms.round())).expect("valid header"),
            );
        }
        self.respond(state, svg, StatusCode::OK, headers).await
    }

    pub async fn not_found(self, state: &AppState, svg: String) -> Response {
        self.failure(state, svg, StatusCode::NOT_FOUND).await
    }

    pub async fn error(self, state: &AppState, svg: String, err: &AppError) -> Response {
        tracing::warn!(error = %err, "failed to build embed");
        self.failure(state, svg, err.status()).await
    }

    async fn failure(self, state: &AppState, svg: String, status: StatusCode) -> Response {
        let mut headers = HeaderMap::new();
        headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        headers.insert(
            HeaderName::from_static("x-error-status"),
            HeaderValue::from(status.as_u16()),
        );
        // Crawlers won't show images with an error status.
        let status = if self.image_crawler { StatusCode::OK } else { status };
        self.respond(state, svg, status, headers).await
    }

    async fn respond(self, state: &AppState, svg: String, status: StatusCode, mut headers: HeaderMap) -> Response {
        let (content_type, body) = if self.png {
            match state.renderer.render_png(svg).await {
                Ok(png) => ("image/png", png),
                Err(err) => {
                    tracing::error!(error = %err, "failed to render png");
                    return err.status().into_response();
                }
            }
        } else {
            ("image/svg+xml", svg.into_bytes())
        };
        headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type));
        (status, headers, body).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::is_legacy_host;

    #[test]
    fn detects_the_legacy_domain() {
        assert!(is_legacy_host("modfolio.creeperkatze.de"));
        assert!(is_legacy_host("Modfolio.Creeperkatze.DE:443"));
        assert!(!is_legacy_host("modfolio.creeperkatze.dev"));
        assert!(!is_legacy_host(""));
    }
}
