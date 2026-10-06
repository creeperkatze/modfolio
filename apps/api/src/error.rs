use std::fmt;

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

use crate::platform::Platform;

#[derive(Debug)]
pub enum AppError {
    Upstream {
        platform: Platform,
        status: Option<StatusCode>,
        message: String,
    },
    Internal(String),
}

impl AppError {
    pub fn status(&self) -> StatusCode {
        match self {
            AppError::Upstream { .. } => StatusCode::BAD_GATEWAY,
            AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    pub fn title(&self) -> &'static str {
        match self {
            AppError::Upstream { .. } => "API Unavailable",
            AppError::Internal(_) => "Internal Server Error",
        }
    }

    pub fn badge_text(&self) -> &'static str {
        match self {
            AppError::Upstream { .. } => "Unavailable",
            AppError::Internal(_) => "Error",
        }
    }

    pub fn detail(&self) -> &str {
        match self {
            AppError::Upstream { message, .. } => message,
            AppError::Internal(_) => "",
        }
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Upstream {
                platform,
                status: Some(status),
                message,
            } => write!(f, "{} API returned {status}: {message}", platform.name()),
            AppError::Upstream { platform, message, .. } => {
                write!(f, "{} API request failed: {message}", platform.name())
            }
            AppError::Internal(message) => f.write_str(message),
        }
    }
}

impl std::error::Error for AppError {}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::warn!(error = %self, "request failed");
        (self.status(), Json(json!({ "error": self.title() }))).into_response()
    }
}
