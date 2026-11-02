use std::future::Future;
use std::sync::Arc;
use std::time::Duration;

use reqwest::header::{ACCEPT, USER_AGENT};
use reqwest::{StatusCode, Url};
use serde::de::DeserializeOwned;
use serde_json::Value;

use crate::error::AppError;
use crate::metrics::Metrics;
use crate::platform::Platform;

const TIMEOUT: Duration = Duration::from_secs(10);

pub fn url(base: &str, segments: &[&str]) -> Url {
    let mut url = Url::parse(base).expect("base URLs are valid");
    url.path_segments_mut()
        .expect("base URLs can have paths")
        .extend(segments);
    url
}

#[derive(Debug)]
pub struct FetchError {
    /// `None` for timeouts, network and decode errors.
    pub status: Option<StatusCode>,
    pub message: String,
}

impl FetchError {
    pub fn into_app_error(self, platform: Platform) -> AppError {
        AppError::Upstream {
            platform,
            status: self.status,
            message: self.message,
        }
    }
}

impl From<reqwest::Error> for FetchError {
    fn from(err: reqwest::Error) -> Self {
        FetchError {
            status: None,
            message: err.to_string(),
        }
    }
}

pub struct Upstream {
    pub client: reqwest::Client,
    pub user_agent: String,
    pub curseforge_api_key: Option<String>,
    metrics: Arc<Metrics>,
}

impl Upstream {
    pub fn new(user_agent: String, curseforge_api_key: Option<String>, metrics: Arc<Metrics>) -> Self {
        let client = reqwest::Client::builder()
            .timeout(TIMEOUT)
            .build()
            .expect("failed to build the HTTP client");
        Upstream {
            client,
            user_agent,
            curseforge_api_key,
            metrics,
        }
    }

    pub async fn get_json<T: DeserializeOwned>(
        &self,
        platform: Platform,
        url: Url,
        query: &[(&str, String)],
    ) -> Result<T, FetchError> {
        let mut request = self
            .client
            .get(url)
            .query(query)
            .header(USER_AGENT, &self.user_agent)
            .header(ACCEPT, "application/json");
        if platform == Platform::CurseForge
            && let Some(key) = &self.curseforge_api_key
        {
            request = request.header("x-api-key", key);
        }

        let response = request.send().await?;
        let status = response.status();
        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(FetchError {
                status: Some(status),
                message: error_message(status, &body),
            });
        }

        let bytes = response.bytes().await?;
        serde_json::from_slice(&bytes).map_err(|err| FetchError {
            status: None,
            message: err.to_string(),
        })
    }

    /// Times and counts one platform call. A 4xx response counts as not found.
    pub async fn call<T>(
        &self,
        platform: Platform,
        request: impl Future<Output = Result<Option<T>, FetchError>>,
    ) -> Result<Option<T>, AppError> {
        let timer = self
            .metrics
            .upstream_api_duration_seconds
            .with_label_values(&[platform.name()])
            .start_timer();
        let result = request.await;
        timer.observe_duration();

        let (outcome, result) = match result {
            Ok(value) => ("success", Ok(value)),
            Err(err) if err.status.is_some_and(|s| s.is_client_error()) => ("client_error", Ok(None)),
            Err(err) => ("error", Err(err.into_app_error(platform))),
        };
        self.metrics
            .upstream_api_requests_total
            .with_label_values(&[platform.name(), outcome])
            .inc();
        result
    }
}

fn error_message(status: StatusCode, body: &str) -> String {
    let json: Option<Value> = serde_json::from_str(body).ok();
    let text = |value: Option<&Value>| {
        value
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .map(str::to_string)
    };
    json.and_then(|json| {
        text(json.get("description"))
            .or_else(|| text(json.get("message")))
            .or_else(|| text(json.get("error")))
            .or_else(|| text(json.get("error").and_then(|e| e.get("message"))))
    })
    .unwrap_or_else(|| status.to_string())
}
