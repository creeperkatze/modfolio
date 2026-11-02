use std::io::Cursor;

use base64::Engine as _;
use base64::engine::general_purpose::STANDARD;
use futures::future::join_all;
use reqwest::header::USER_AGENT;

use crate::model::ProjectItem;
use crate::upstream::Upstream;

const PNG_MAGIC: &[u8] = b"\x89PNG\r\n\x1a\n";

fn to_png(bytes: &[u8]) -> Option<Vec<u8>> {
    if bytes.starts_with(PNG_MAGIC) {
        return Some(bytes.to_vec());
    }
    if let Ok(image) = image::load_from_memory(bytes) {
        let mut png = Vec::new();
        image
            .write_to(&mut Cursor::new(&mut png), image::ImageFormat::Png)
            .ok()?;
        return Some(png);
    }
    crate::render::rasterize_svg(bytes)
}

async fn encode_data_uri(bytes: Vec<u8>) -> Option<String> {
    let png = tokio::task::spawn_blocking(move || to_png(&bytes))
        .await
        .ok()
        .flatten()?;
    Some(format!("data:image/png;base64,{}", STANDARD.encode(png)))
}

async fn download(upstream: &Upstream, url: &str) -> reqwest::Result<Vec<u8>> {
    let response = upstream
        .client
        .get(url)
        .header(USER_AGENT, &upstream.user_agent)
        .send()
        .await?
        .error_for_status()?;
    Ok(response.bytes().await?.to_vec())
}

pub async fn fetch_image(upstream: &Upstream, url: &str) -> Option<String> {
    let bytes = match download(upstream, url).await {
        Ok(bytes) => bytes,
        Err(err) => {
            tracing::debug!(url, error = %err, "failed to fetch image");
            return None;
        }
    };
    let encoded = encode_data_uri(bytes).await;
    if encoded.is_none() {
        tracing::debug!(url, "unsupported image format");
    }
    encoded
}

pub async fn enrich_image(upstream: &Upstream, url: Option<&str>) -> Option<String> {
    match url.filter(|u| !u.is_empty()) {
        Some(url) => fetch_image(upstream, url).await,
        None => None,
    }
}

pub async fn enrich_image_from_base64(upstream: &Upstream, data: Option<&str>, fallback_url: &str) -> Option<String> {
    if let Some(bytes) = data.and_then(|d| STANDARD.decode(d.trim()).ok())
        && let Some(uri) = encode_data_uri(bytes).await
    {
        return Some(uri);
    }
    fetch_image(upstream, fallback_url).await
}

pub async fn fetch_project_icons(upstream: &Upstream, projects: &mut [ProjectItem]) {
    let icons = join_all(projects.iter().map(|p| async move {
        match p.icon_url.as_deref().filter(|u| !u.is_empty()) {
            Some(url) => fetch_image(upstream, url).await,
            None => None,
        }
    }))
    .await;
    for (project, icon) in projects.iter_mut().zip(icons) {
        if icon.is_some() {
            project.icon = icon;
        }
    }
}
