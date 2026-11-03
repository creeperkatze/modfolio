pub mod curseforge;
pub mod hangar;
pub mod modrinth;
pub mod spigot;

use std::future::Future;

use chrono::{DateTime, Utc};
use futures::future::join_all;

use crate::model::ProjectItem;

pub fn sort_by_downloads_desc<T>(items: &mut [T], downloads: impl Fn(&T) -> f64) {
    items.sort_by(|a, b| downloads(b).total_cmp(&downloads(a)));
}

pub async fn attach_version_dates<F, Fut>(projects: &mut [ProjectItem], fetch: F)
where
    F: Fn(String) -> Fut,
    Fut: Future<Output = Vec<DateTime<Utc>>>,
{
    let dates = join_all(projects.iter().map(|p| fetch(p.id.clone()))).await;
    for (project, dates) in projects.iter_mut().zip(dates) {
        project.version_dates = dates;
    }
}

pub fn all_version_dates(projects: &[ProjectItem]) -> Vec<DateTime<Utc>> {
    projects.iter().flat_map(|p| p.version_dates.iter().copied()).collect()
}
