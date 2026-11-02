pub mod curseforge;
pub mod hangar;
pub mod modrinth;
pub mod spigot;

use std::cmp::Ordering;
use std::future::Future;
use std::time::Instant;

use futures::future::join_all;

use crate::model::ProjectItem;

pub fn elapsed_ms(start: Instant) -> f64 {
    start.elapsed().as_secs_f64() * 1000.0
}

pub fn sort_by_downloads_desc<T>(items: &mut [T], downloads: impl Fn(&T) -> f64) {
    items.sort_by(|a, b| downloads(b).partial_cmp(&downloads(a)).unwrap_or(Ordering::Equal));
}

pub fn sort_by_date_desc<T>(items: &mut [T], date: impl Fn(&T) -> f64) {
    items.sort_by(|a, b| date(b).partial_cmp(&date(a)).unwrap_or(Ordering::Equal));
}

pub fn date_ms(date: Option<&str>) -> f64 {
    date.and_then(crate::format::parse_date_ms)
        .map_or(f64::NAN, |ms| ms as f64)
}

pub async fn attach_version_dates<F, Fut>(projects: &mut [ProjectItem], fetch: F)
where
    F: Fn(String) -> Fut,
    Fut: Future<Output = Vec<String>>,
{
    let dates = join_all(projects.iter().map(|p| fetch(p.id.clone()))).await;
    for (project, dates) in projects.iter_mut().zip(dates) {
        project.version_dates = dates;
    }
}

pub fn all_version_dates(projects: &[ProjectItem]) -> Vec<String> {
    projects.iter().flat_map(|p| p.version_dates.iter().cloned()).collect()
}
