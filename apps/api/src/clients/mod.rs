pub mod curseforge;
pub mod hangar;
pub mod modrinth;
pub mod spigot;

use serde::{Deserialize, Deserializer};

pub fn nullable<'de, D, T>(deserializer: D) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de> + Default,
{
    Ok(Option::<T>::deserialize(deserializer)?.unwrap_or_default())
}

pub fn numeric_id(id: &str) -> Option<String> {
    if !id.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    id.parse::<u64>().ok().map(|id| id.to_string())
}
