use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use crate::format::now_ms;
use crate::metrics::Metrics;
use crate::model::{BadgeData, CardData};

#[derive(Clone)]
pub enum CachedValue {
    Card(Arc<CardData>),
    Badge(Arc<BadgeData>),
    Json(serde_json::Value),
}

struct Entry {
    value: CachedValue,
    expiry: i64,
}

pub struct Cache {
    entries: Mutex<HashMap<String, Entry>>,
    ttl_ms: i64,
    metrics: Arc<Metrics>,
}

impl Cache {
    pub fn new(ttl: Duration, metrics: Arc<Metrics>) -> Self {
        Cache {
            entries: Mutex::new(HashMap::new()),
            ttl_ms: ttl.as_millis() as i64,
            metrics,
        }
    }

    pub fn get(&self, key: &str) -> Option<CachedValue> {
        let mut entries = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        let result = match entries.get(key) {
            Some(entry) if now_ms() > entry.expiry => {
                entries.remove(key);
                self.metrics.cache_size.set(entries.len() as i64);
                None
            }
            Some(entry) => Some(entry.value.clone()),
            None => None,
        };
        let label = if result.is_some() { "hit" } else { "miss" };
        self.metrics.cache_operations_total.with_label_values(&[label]).inc();
        result
    }

    pub fn set(&self, key: impl Into<String>, value: CachedValue) {
        let now = now_ms();
        let mut entries = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        entries.insert(
            key.into(),
            Entry {
                value,
                expiry: now + self.ttl_ms,
            },
        );
        self.metrics.cache_size.set(entries.len() as i64);
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
