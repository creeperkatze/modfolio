use axum::Router;
use axum::body::Body;
use axum::http::{HeaderMap, Request, StatusCode};
use http_body_util::BodyExt;
use modfolio_api::{AppState, Config, app};
use serde_json::Value;
use tower::ServiceExt;

fn router() -> Router {
    let mut config = Config::from_env();
    if config.curseforge_api_key.is_none() {
        config.curseforge_api_key = dotenvy::dotenv_iter()
            .ok()
            .and_then(|vars| vars.flatten().find(|(key, _)| key == "CURSEFORGE_API_KEY"))
            .map(|(_, value)| value)
            .filter(|value| !value.is_empty());
    }
    app(AppState::new(config))
}

struct TestResponse {
    status: StatusCode,
    headers: HeaderMap,
    body: Vec<u8>,
}

impl TestResponse {
    fn header(&self, name: &str) -> &str {
        self.headers.get(name).and_then(|v| v.to_str().ok()).unwrap_or_default()
    }

    fn text(&self) -> String {
        String::from_utf8_lossy(&self.body).into_owned()
    }

    fn json(&self) -> Value {
        serde_json::from_slice(&self.body).expect("JSON body")
    }

    fn assert_svg(&self) {
        assert_eq!(self.status, StatusCode::OK);
        assert!(self.header("content-type").contains("image/svg+xml"));
    }
}

async fn get(path: &str) -> TestResponse {
    let response = router()
        .oneshot(Request::get(path).body(Body::empty()).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let body = response.into_body().collect().await.unwrap().to_bytes().to_vec();
    TestResponse { status, headers, body }
}

mod modrinth {
    use super::*;

    #[tokio::test]
    async fn serves_a_user_card() {
        let res = get("/modrinth/user/prospector").await;
        res.assert_svg();
        assert!(res.text().contains("<svg"));
    }

    #[tokio::test]
    async fn serves_a_project_card() {
        let res = get("/modrinth/project/sodium").await;
        res.assert_svg();
        assert!(res.text().contains("<svg"));
    }

    #[tokio::test]
    async fn serves_an_organization_card() {
        get("/modrinth/organization/caffeinemc").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_collection_card() {
        get("/modrinth/collection/syf8P1xf").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_user_downloads_badge() {
        get("/modrinth/user/prospector/downloads").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_project_versions_badge() {
        get("/modrinth/project/sodium/versions").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_an_organization_projects_badge() {
        get("/modrinth/organization/caffeinemc/projects").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_collection_followers_badge() {
        get("/modrinth/collection/syf8P1xf/followers").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_project_meta_as_json() {
        let res = get("/modrinth/meta/project/sodium").await;
        assert_eq!(res.status, StatusCode::OK);
        assert!(res.header("content-type").contains("application/json"));
        let body = res.json();
        assert!(body["name"].is_string());
        assert!(body["url"].as_str().unwrap().contains("modrinth.com"));
    }

    #[tokio::test]
    async fn serves_user_meta_as_json() {
        let res = get("/modrinth/meta/user/prospector").await;
        assert_eq!(res.status, StatusCode::OK);
        let body = res.json();
        assert!(body["name"].is_string());
        assert!(body["url"].as_str().unwrap().contains("modrinth.com/user/prospector"));
    }

    #[tokio::test]
    async fn returns_a_404_card_for_a_nonexistent_user() {
        let res = get("/modrinth/user/this-user-should-not-exist-xyz123").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert_eq!(res.header("x-error-status"), "404");
        assert!(res.header("content-type").contains("image/svg+xml"));
    }

    #[tokio::test]
    async fn returns_404_json_for_meta_of_a_nonexistent_project() {
        let res = get("/modrinth/meta/project/this-project-should-not-exist-xyz123").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert!(res.json()["error"].is_string());
    }

    #[tokio::test]
    async fn renders_png_for_image_crawlers() {
        let response = router()
            .oneshot(
                Request::get("/modrinth/project/sodium/downloads")
                    .header("user-agent", "Mozilla/5.0 (compatible; Discordbot/2.0)")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.headers()["content-type"], "image/png");
        let body = response.into_body().collect().await.unwrap().to_bytes();
        assert!(body.starts_with(b"\x89PNG"));
    }
}

mod curseforge {
    use super::*;

    #[tokio::test]
    async fn serves_a_project_card() {
        let res = get("/curseforge/project/238222").await;
        res.assert_svg();
        assert!(res.text().contains("<svg"));
    }

    #[tokio::test]
    async fn serves_a_user_card() {
        get("/curseforge/user/17072262").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_project_rank_badge() {
        get("/curseforge/project/238222/rank").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_user_projects_badge() {
        get("/curseforge/user/17072262/projects").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_project_meta_as_json() {
        let res = get("/curseforge/meta/project/238222").await;
        assert_eq!(res.status, StatusCode::OK);
        let body = res.json();
        assert!(body["name"].is_string());
        assert!(body["url"].as_str().unwrap().contains("curseforge.com"));
    }

    #[tokio::test]
    async fn resolves_a_project_slug_to_its_numeric_id() {
        let res = get("/curseforge/lookup/jei").await;
        assert_eq!(res.status, StatusCode::OK);
        assert_eq!(res.json()["id"], 238222);
    }

    #[tokio::test]
    async fn resolves_a_username_to_its_numeric_id() {
        let res = get("/curseforge/lookup/user/mezz").await;
        assert_eq!(res.status, StatusCode::OK);
        assert_eq!(res.json()["id"], "17072262");
    }

    #[tokio::test]
    async fn returns_a_404_card_for_a_nonexistent_project() {
        let res = get("/curseforge/project/999999999").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert_eq!(res.header("x-error-status"), "404");
    }

    #[tokio::test]
    async fn rejects_a_non_numeric_project_id_on_meta() {
        let res = get("/curseforge/meta/project/not-a-number").await;
        assert_eq!(res.status, StatusCode::BAD_REQUEST);
    }
}

mod hangar {
    use super::*;

    #[tokio::test]
    async fn serves_a_project_card() {
        let res = get("/hangar/project/Maintenance").await;
        res.assert_svg();
        assert!(res.text().contains("<svg"));
    }

    #[tokio::test]
    async fn serves_a_project_views_badge() {
        get("/hangar/project/Maintenance/views").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_project_meta_as_json() {
        let res = get("/hangar/meta/Maintenance").await;
        assert_eq!(res.status, StatusCode::OK);
        let body = res.json();
        assert!(body["name"].is_string());
        assert!(body["url"].as_str().unwrap().contains("hangar.papermc.io"));
    }

    #[tokio::test]
    async fn returns_a_404_card_for_a_nonexistent_project() {
        let res = get("/hangar/project/this-project-should-not-exist-xyz123").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert_eq!(res.header("x-error-status"), "404");
    }
}

mod spigot {
    use super::*;

    #[tokio::test]
    async fn serves_a_resource_card() {
        let res = get("/spigot/resource/28140").await;
        res.assert_svg();
        assert!(res.text().contains("<svg"));
    }

    #[tokio::test]
    async fn serves_an_author_card() {
        get("/spigot/author/100356").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_a_resource_likes_badge() {
        get("/spigot/resource/28140/likes").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_an_author_resources_badge() {
        get("/spigot/author/100356/resources").await.assert_svg();
    }

    #[tokio::test]
    async fn serves_resource_meta_as_json() {
        let res = get("/spigot/meta/28140").await;
        assert_eq!(res.status, StatusCode::OK);
        let body = res.json();
        assert!(body["name"].is_string());
        assert!(body["url"].as_str().unwrap().contains("spigotmc.org"));
    }

    #[tokio::test]
    async fn rejects_a_non_numeric_id() {
        let res = get("/spigot/meta/not-a-number").await;
        assert_eq!(res.status, StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn returns_a_404_card_for_a_nonexistent_resource() {
        let res = get("/spigot/resource/999999999").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert_eq!(res.header("x-error-status"), "404");
    }
}

mod errors {
    use super::*;

    #[tokio::test]
    async fn returns_json_404_for_an_unknown_route() {
        let res = get("/this-route-does-not-exist").await;
        assert_eq!(res.status, StatusCode::NOT_FOUND);
        assert_eq!(res.json(), serde_json::json!({ "error": "not found" }));
    }

    #[tokio::test]
    async fn legacy_paths_no_longer_resolve() {
        for path in [
            "/user/prospector",
            "/project/sodium",
            "/organization/caffeinemc",
            "/collection/syf8P1xf",
            "/card/summary/prospector",
            "/card/user/prospector",
        ] {
            assert_eq!(get(path).await.status, StatusCode::NOT_FOUND, "{path}");
        }
    }

    #[tokio::test]
    async fn metrics_require_a_token() {
        let res = get("/metrics").await;
        assert_eq!(res.status, StatusCode::UNAUTHORIZED);
        assert_eq!(res.json(), serde_json::json!({ "error": "unauthorized" }));
    }

    #[tokio::test]
    async fn serves_public_assets() {
        let res = get("/fonts/Inter-Bold.ttf").await;
        assert_eq!(res.status, StatusCode::OK);
        assert!(!res.body.is_empty());
    }
}
