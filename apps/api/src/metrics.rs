use prometheus::{
    Encoder, Histogram, HistogramOpts, HistogramVec, IntCounterVec, IntGauge, Opts, Registry, TextEncoder,
};

const PREFIX: &str = "modfolio_";

pub struct Metrics {
    registry: Registry,
    pub http_requests_total: IntCounterVec,
    pub http_request_duration_seconds: HistogramVec,
    pub crawler_requests_total: IntCounterVec,
    pub embed_requests_total: IntCounterVec,
    pub cache_operations_total: IntCounterVec,
    pub cache_size: IntGauge,
    pub upstream_api_requests_total: IntCounterVec,
    pub upstream_api_duration_seconds: HistogramVec,
    pub png_render_duration_seconds: Histogram,
}

fn counter(registry: &Registry, name: &str, help: &str, labels: &[&str]) -> IntCounterVec {
    let metric = IntCounterVec::new(Opts::new(format!("{PREFIX}{name}"), help), labels).expect("valid counter");
    registry.register(Box::new(metric.clone())).expect("unique counter");
    metric
}

fn histogram(registry: &Registry, name: &str, help: &str, labels: &[&str], buckets: &[f64]) -> HistogramVec {
    let opts = HistogramOpts::new(format!("{PREFIX}{name}"), help).buckets(buckets.to_vec());
    let metric = HistogramVec::new(opts, labels).expect("valid histogram");
    registry.register(Box::new(metric.clone())).expect("unique histogram");
    metric
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();

        #[cfg(target_os = "linux")]
        registry
            .register(Box::new(prometheus::process_collector::ProcessCollector::new(
                std::process::id() as i32,
                "modfolio",
            )))
            .expect("process collector");

        let cache_size = IntGauge::new(
            format!("{PREFIX}cache_size"),
            "Number of entries currently stored in the API data cache",
        )
        .expect("valid gauge");
        registry.register(Box::new(cache_size.clone())).expect("unique gauge");

        let png_render_duration_seconds = Histogram::with_opts(
            HistogramOpts::new(
                format!("{PREFIX}png_render_duration_seconds"),
                "SVG to PNG rasterization duration in seconds",
            )
            .buckets(vec![0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]),
        )
        .expect("valid histogram");
        registry
            .register(Box::new(png_render_duration_seconds.clone()))
            .expect("unique histogram");

        Metrics {
            http_requests_total: counter(
                &registry,
                "http_requests_total",
                "Total number of HTTP requests",
                &["method", "route", "status"],
            ),
            http_request_duration_seconds: histogram(
                &registry,
                "http_request_duration_seconds",
                "HTTP request duration in seconds",
                &["method", "route"],
                &[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
            ),
            crawler_requests_total: counter(
                &registry,
                "crawler_requests_total",
                "Total number of requests from known crawlers/bots",
                &["crawler"],
            ),
            embed_requests_total: counter(
                &registry,
                "embed_requests_total",
                "Total number of embed (card/badge) requests",
                &["platform", "surface", "entity", "format", "status"],
            ),
            cache_operations_total: counter(
                &registry,
                "cache_operations_total",
                "Total number of API data cache lookups",
                &["result"],
            ),
            cache_size,
            upstream_api_requests_total: counter(
                &registry,
                "upstream_api_requests_total",
                "Total requests made to upstream platform APIs",
                &["platform", "status"],
            ),
            upstream_api_duration_seconds: histogram(
                &registry,
                "upstream_api_request_duration_seconds",
                "Upstream platform API request duration in seconds",
                &["platform"],
                &[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
            ),
            png_render_duration_seconds,
            registry,
        }
    }

    pub fn encode(&self) -> (String, String) {
        let encoder = TextEncoder::new();
        let mut buffer = Vec::new();
        encoder
            .encode(&self.registry.gather(), &mut buffer)
            .expect("metrics encode into a Vec");
        (
            String::from_utf8(buffer).unwrap_or_default(),
            encoder.format_type().to_string(),
        )
    }
}

impl Default for Metrics {
    fn default() -> Self {
        Self::new()
    }
}
