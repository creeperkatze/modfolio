use std::sync::Arc;
use std::time::Duration;

use crate::metrics::Metrics;
use crate::model::{BadgeData, CardData};

#[derive(Clone)]
pub enum CachedValue {
    Card(Arc<CardData>),
    Badge(Arc<BadgeData>),
    Json(serde_json::Value),
}

pub struct Cache {
    entries: moka::sync::Cache<String, CachedValue>,
    metrics: Arc<Metrics>,
}

impl Cache {
    pub fn new(ttl: Duration, metrics: Arc<Metrics>) -> Self {
        Cache {
            entries: moka::sync::Cache::builder().time_to_live(ttl).build(),
            metrics,
        }
    }

    pub fn get(&self, key: &str) -> Option<CachedValue> {
        let result = self.entries.get(key);
        let label = if result.is_some() { "hit" } else { "miss" };
        self.metrics.cache_operations_total.with_label_values(&[label]).inc();
        self.update_size();
        result
    }

    pub fn set(&self, key: impl Into<String>, value: CachedValue) {
        self.entries.insert(key.into(), value);
        self.update_size();
    }

    fn update_size(&self) {
        self.metrics.cache_size.set(self.entries.entry_count() as i64);
    }
}

pub fn key(platform: &str, entity_type: &str, id: &str) -> String {
    format!("{platform}:{entity_type}:{id}")
}

pub fn badge_key(platform: &str, entity_type: &str, id: &str) -> String {
    format!("{platform}:{entity_type}:{id}:badge")
}

pub fn meta_key(platform: &str, entity_type: &str, id: &str) -> String {
    format!("meta:{platform}:{entity_type}:{id}")
}
