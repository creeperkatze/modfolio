use crate::icons;

pub const DEFAULT_COUNT: usize = 5;
pub const MAX_COUNT: usize = 10;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Platform {
    Modrinth,
    CurseForge,
    Hangar,
    Spigot,
}

pub struct StatConfig {
    pub label: &'static str,
    pub field: &'static str,
}

const fn stat(label: &'static str, field: &'static str) -> StatConfig {
    StatConfig { label, field }
}

const PROFILE_STATS: [StatConfig; 3] = [
    stat("Downloads", "totalDownloads"),
    stat("Followers", "totalFollowers"),
    stat("Projects", "projectCount"),
];

impl Platform {
    pub fn id(self) -> &'static str {
        match self {
            Platform::Modrinth => "modrinth",
            Platform::CurseForge => "curseforge",
            Platform::Hangar => "hangar",
            Platform::Spigot => "spigot",
        }
    }

    pub fn name(self) -> &'static str {
        match self {
            Platform::Modrinth => "Modrinth",
            Platform::CurseForge => "CurseForge",
            Platform::Hangar => "Hangar",
            Platform::Spigot => "Spigot",
        }
    }

    pub fn default_color(self) -> &'static str {
        match self {
            Platform::Modrinth => "#1bd96a",
            Platform::CurseForge => "#F16436",
            Platform::Hangar => "#3371ED",
            Platform::Spigot => "#E8A838",
        }
    }

    pub fn icon(self, color: &str) -> String {
        let name = match self {
            Platform::Modrinth => "modrinth",
            Platform::CurseForge => "curseforge",
            Platform::Hangar => "hangar",
            Platform::Spigot => "spigotPlatform",
        };
        icons::icon(name, color).unwrap_or_default()
    }

    pub fn icon_view_box(self) -> &'static str {
        match self {
            Platform::Modrinth => "0 0 512 514",
            Platform::CurseForge => "0 0 32 32",
            Platform::Hangar | Platform::Spigot => "0 0 100 100",
        }
    }

    pub fn latest_versions_label(self) -> &'static str {
        match self {
            Platform::CurseForge => "Latest Files",
            _ => "Latest Versions",
        }
    }

    pub fn top_projects_label(self) -> &'static str {
        match self {
            Platform::Spigot => "Top Resources",
            _ => "Top Projects",
        }
    }

    pub fn stat_configs(self, entity_type: &str) -> &'static [StatConfig] {
        const MODRINTH_PROJECT: [StatConfig; 3] = [
            stat("Downloads", "downloads"),
            stat("Followers", "followers"),
            stat("Versions", "versionCount"),
        ];
        const MODRINTH_SERVER: [StatConfig; 2] =
            [stat("Online", "playersOnline"), stat("Recent Plays", "verifiedPlays2w")];
        const CURSEFORGE_PROJECT: [StatConfig; 3] = [
            stat("Downloads", "downloads"),
            stat("Files", "versionCount"),
            stat("Rank", "rank"),
        ];
        const HANGAR_PROJECT: [StatConfig; 3] = [
            stat("Downloads", "downloads"),
            stat("Stars", "stars"),
            stat("Versions", "versionCount"),
        ];
        const HANGAR_USER: [StatConfig; 3] = [
            stat("Downloads", "totalDownloads"),
            stat("Stars", "totalStars"),
            stat("Projects", "projectCount"),
        ];
        const SPIGOT_RESOURCE: [StatConfig; 3] = [
            stat("Downloads", "downloads"),
            stat("Likes", "likes"),
            stat("Rating", "rating"),
        ];
        const SPIGOT_AUTHOR: [StatConfig; 3] = [
            stat("Downloads", "totalDownloads"),
            stat("Resources", "resourceCount"),
            stat("Rating", "avgRating"),
        ];

        match (self, entity_type) {
            (Platform::Modrinth, "project") => &MODRINTH_PROJECT,
            (Platform::Modrinth, "user" | "organization" | "collection") => &PROFILE_STATS,
            (Platform::Modrinth, "server") => &MODRINTH_SERVER,
            (Platform::CurseForge, "project") => &CURSEFORGE_PROJECT,
            (Platform::CurseForge, "user") => &PROFILE_STATS,
            (Platform::Hangar, "project") => &HANGAR_PROJECT,
            (Platform::Hangar, "user") => &HANGAR_USER,
            (Platform::Spigot, "resource") => &SPIGOT_RESOURCE,
            (Platform::Spigot, "user" | "author") => &SPIGOT_AUTHOR,
            _ => &[],
        }
    }

    pub fn not_found_message(self, entity: &str) -> &'static str {
        match (self, entity) {
            (Platform::Spigot, "author") => "Author not found",
            (Platform::Spigot, _) => "Resource not found",
            (_, "user") => "User not found",
            (_, "organization") => "Organization not found",
            (_, "collection") => "Collection not found",
            _ => "Project not found",
        }
    }
}

pub fn loader_color(loader: &str) -> &'static str {
    match loader.to_lowercase().as_str() {
        "fabric" => "#8a7b71",
        "quilt" => "#8b61b4",
        "forge" => "#5b6197",
        "neoforge" => "#dc895c",
        "liteloader" => "#4c90de",
        "bukkit" => "#e78362",
        "bungeecord" => "#c69e39",
        "folia" => "#6aa54f",
        "paper" => "#e67e7e",
        "purpur" => "#7763a3",
        "spigot" => "#cd7a21",
        "velocity" => "#4b98b0",
        "waterfall" => "#5f83cb",
        "sponge" => "#c49528",
        "ornithe" => "#6097ca",
        "bta-babric" => "#5ba938",
        "legacy-fabric" => "#6879f6",
        "nilloader" => "#dd5088",
        _ => "#8b949e",
    }
}

pub fn project_type_icon(project_type: Option<&str>) -> &'static str {
    match project_type.map(str::to_lowercase).as_deref() {
        Some("modpack") => "package-open",
        Some("resourcepack") => "paintbrush",
        Some("shader") => "glasses",
        Some("plugin") => "plug",
        Some("datapack") => "datapack",
        Some("minecraft_java_server" | "minecraft_bedrock_server") => "hard-drive",
        _ => "box",
    }
}

pub fn curseforge_class_icon(class_id: i64) -> &'static str {
    match class_id {
        5 => "plug",
        12 => "paintbrush",
        17 => "earth",
        4471 => "package-open",
        4546 | 6552 | 6768 => "glasses",
        6945 => "datapack",
        84203 => "optifine",
        84200 => "canvas",
        _ => "box",
    }
}
