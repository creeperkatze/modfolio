use modfolio_api::{AppState, Config, app};
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

fn main() {
    // Loaded before the runtime starts its threads.
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .init();

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .expect("failed to start the tokio runtime")
        .block_on(serve());
}

async fn serve() {
    let config = Config::from_env();
    let listener = TcpListener::bind(("0.0.0.0", config.port))
        .await
        .expect("failed to bind the listen address");
    tracing::info!(
        "listening on {}",
        listener.local_addr().expect("bound listener has an address")
    );

    axum::serve(listener, app(AppState::new(config)))
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c().await.ok();
    };

    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut signal) = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            signal.recv().await;
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {}
        () = terminate => {}
    }
}
