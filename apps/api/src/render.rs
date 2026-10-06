use std::path::Path;
use std::sync::Arc;
use std::time::Instant;

use resvg::{tiny_skia, usvg};

use crate::error::AppError;
use crate::metrics::Metrics;

const OUTPUT_WIDTH: u32 = 800;

pub struct Renderer {
    options: Arc<usvg::Options<'static>>,
    metrics: Arc<Metrics>,
}

impl Renderer {
    pub fn new(fonts_dir: &Path, metrics: Arc<Metrics>) -> Self {
        let mut options = usvg::Options {
            font_family: "Inter".into(),
            ..usvg::Options::default()
        };
        let fontdb = options.fontdb_mut();
        match std::fs::read_dir(fonts_dir) {
            Ok(entries) => {
                for path in entries.filter_map(|e| e.ok().map(|e| e.path())) {
                    let is_font = path
                        .extension()
                        .and_then(|e| e.to_str())
                        .is_some_and(|e| matches!(e.to_ascii_lowercase().as_str(), "ttf" | "otf" | "woff2"));
                    if is_font && let Err(err) = fontdb.load_font_file(&path) {
                        tracing::warn!(path = %path.display(), error = %err, "failed to load font");
                    }
                }
            }
            Err(err) => tracing::warn!(dir = %fonts_dir.display(), error = %err, "failed to read font directory"),
        }
        fontdb.set_sans_serif_family("Inter");

        Renderer {
            options: Arc::new(options),
            metrics,
        }
    }

    pub async fn render_png(&self, svg: String) -> Result<Vec<u8>, AppError> {
        let options = self.options.clone();
        let start = Instant::now();
        let png = tokio::task::spawn_blocking(move || render(&svg, &options))
            .await
            .map_err(|err| AppError::Internal(err.to_string()))??;
        self.metrics
            .png_render_duration_seconds
            .observe(start.elapsed().as_secs_f64());
        Ok(png)
    }
}

fn render(svg: &str, options: &usvg::Options) -> Result<Vec<u8>, AppError> {
    let tree = usvg::Tree::from_str(svg, options).map_err(|err| AppError::Internal(err.to_string()))?;
    let size = tree.size();
    // Rounded to match the old resvg-js output size.
    let width = OUTPUT_WIDTH;
    let height = (OUTPUT_WIDTH as f32 * size.height() / size.width()).round() as u32;
    let mut pixmap =
        tiny_skia::Pixmap::new(width, height).ok_or_else(|| AppError::Internal("invalid PNG size".into()))?;
    let transform = tiny_skia::Transform::from_scale(width as f32 / size.width(), height as f32 / size.height());
    resvg::render(&tree, transform, &mut pixmap.as_mut());
    pixmap.encode_png().map_err(|err| AppError::Internal(err.to_string()))
}

pub fn rasterize_svg(data: &[u8]) -> Option<Vec<u8>> {
    let tree = usvg::Tree::from_data(data, &usvg::Options::default()).ok()?;
    let size = tree.size().to_int_size();
    let mut pixmap = tiny_skia::Pixmap::new(size.width(), size.height())?;
    resvg::render(&tree, tiny_skia::Transform::identity(), &mut pixmap.as_mut());
    pixmap.encode_png().ok()
}
