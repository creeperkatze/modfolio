import { ICONS } from "./icons.js";

/**
 * Platform-specific icon viewBox configurations
 */
const PLATFORM_ICON_VIEWBOXES = {
    modrinth: "0 0 512 514",
    curseforge: "0 0 32 32",
    hangar: "0 0 100 100"
};

/**
 * Stat label configurations per platform and entity type
 * Defines what stats to display and their labels/field mappings
 */
const STAT_CONFIGS = {
    modrinth: {
        project: [
            { label: "Downloads", field: "downloads" },
            { label: "Followers", field: "followers" },
            { label: "Versions", field: "versionCount" }
        ],
        user: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Followers", field: "totalFollowers" },
            { label: "Projects", field: "projectCount" }
        ],
        organization: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Followers", field: "totalFollowers" },
            { label: "Projects", field: "projectCount" }
        ],
        collection: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Followers", field: "totalFollowers" },
            { label: "Projects", field: "projectCount" }
        ]
    },
    curseforge: {
        mod: [
            { label: "Downloads", field: "downloads" },
            { label: "Rank", field: "rank" },
            { label: "Files", field: "fileCount" }
        ]
    },
    hangar: {
        project: [
            { label: "Downloads", field: "downloads" },
            { label: "Stars", field: "stars" },
            { label: "Versions", field: "versionCount" }
        ],
        user: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Stars", field: "totalFollowers" },
            { label: "Projects", field: "projectCount" }
        ]
    }
};

/**
 * Platform configuration with all UI text and settings
 * Allows platforms to customize labels, terminology, and behavior
 */
export const PLATFORM_CONFIGS = {
    modrinth: {
        id: "modrinth",
        name: "Modrinth",
        defaultColor: "#1bd96a",
        icon: (color) => ICONS.modrinth(color),
        iconViewBox: PLATFORM_ICON_VIEWBOXES.modrinth,
        labels: {
            stats: {
                downloads: "Downloads",
                followers: "Followers",
                stars: "Stars",
                rank: "Rank",
                versions: "Versions",
                files: "Versions",
                projects: "Projects"
            },
            sections: {
                latestVersions: "Latest Versions",
                topProjects: "Top Projects"
            },
            errors: {
                project: "Project not found",
                user: "User not found",
                organization: "Organization not found",
                collection: "Collection not found",
                mod: "Mod not found"
            }
        },
        statConfigs: STAT_CONFIGS.modrinth,
        terminology: {
            versions: "versions",
            versionField: "date_published"
        }
    },
    curseforge: {
        id: "curseforge",
        name: "CurseForge",
        defaultColor: "#F16436",
        icon: (color) => ICONS.curseforge(color),
        iconViewBox: PLATFORM_ICON_VIEWBOXES.curseforge,
        labels: {
            stats: {
                downloads: "Downloads",
                followers: "Followers",
                stars: "Stars",
                rank: "Rank",
                versions: "Files",
                files: "Files",
                projects: "Projects"
            },
            sections: {
                latestVersions: "Latest Files",
                topProjects: "Top Projects"
            },
            errors: {
                project: "Mod not found",
                user: "User not found",
                organization: "Organization not found",
                collection: "Collection not found",
                mod: "Mod not found"
            }
        },
        statConfigs: STAT_CONFIGS.curseforge,
        terminology: {
            versions: "files",
            versionField: "date_published"
        }
    },
    hangar: {
        id: "hangar",
        name: "Hangar",
        defaultColor: "#3371ED",
        icon: (color) => ICONS.hangar(color),
        iconViewBox: PLATFORM_ICON_VIEWBOXES.hangar,
        labels: {
            stats: {
                downloads: "Downloads",
                followers: "Followers",
                stars: "Stars",
                rank: "Rank",
                versions: "Versions",
                files: "Versions",
                projects: "Projects"
            },
            sections: {
                latestVersions: "Latest Versions",
                topProjects: "Top Projects"
            },
            errors: {
                project: "Project not found",
                user: "User not found",
                organization: "Organization not found",
                collection: "Collection not found",
                mod: "Project not found"
            }
        },
        statConfigs: STAT_CONFIGS.hangar,
        terminology: {
            versions: "versions",
            versionField: "releasedAt"
        }
    }
};

/**
 * Get platform configuration by platform ID
 * @param {string} platformId - Platform ID (modrinth, curseforge, hangar)
 * @returns {Object|null} Platform configuration or null if not found
 */
export function getPlatformConfig(platformId) {
    return PLATFORM_CONFIGS[platformId] || null;
}

/**
 * Get stat configuration for a specific platform and entity type
 * @param {string} platformId - Platform ID
 * @param {string} entityType - Entity type (project, user, organization, collection, mod)
 * @returns {Array|null} Array of stat configs or null if not found
 */
export function getStatConfigs(platformId, entityType) {
    const platform = PLATFORM_CONFIGS[platformId];
    if (!platform) return null;

    // Map CurseForge "mod" to "project" for stat configs
    const statKey = platformId === "curseforge" && entityType === "mod"
        ? "mod"
        : platform.statConfigs[entityType] ? entityType : null;

    return statKey ? platform.statConfigs[statKey] : null;
}

/**
 * Get error message for a platform and entity type
 * @param {string} platformId - Platform ID
 * @param {string} entityType - Entity type
 * @returns {string} Error message
 */
export function getErrorMessage(platformId, entityType) {
    const platform = PLATFORM_CONFIGS[platformId];
    if (!platform) return "Resource not found";

    // Map CurseForge "mod" entity type
    const errorKey = platformId === "curseforge" && entityType === "project" ? "mod" : entityType;
    return platform.labels.errors[errorKey] || "Resource not found";
}

/**
 * Entity type icon names for header generation
 */
export const ENTITY_ICONS = {
    project: "box",
    user: "user",
    organization: "building",
    collection: "collection",
    mod: "box" // CurseForge mods use box icon
};

/**
 * Get entity icon name for header
 * @param {string} entityType - Entity type
 * @returns {string} Icon name
 */
export function getEntityIcon(entityType) {
    return ENTITY_ICONS[entityType] || "box";
}
