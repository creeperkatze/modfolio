import { ICONS } from "./icons.js";

export const CARD_LIMITS = {
    DEFAULT_COUNT: 5,
    MAX_COUNT: 10
};

const PLATFORM_ICON_VIEWBOXES = {
    modrinth: "0 0 512 514",
    curseforge: "0 0 32 32",
    hangar: "0 0 100 100",
    spigot: "0 0 100 100"
};

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
        project: [
            { label: "Downloads", field: "downloads" },
            { label: "Rank", field: "rank" },
            { label: "Files", field: "versionCount" }
        ],
        user: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Followers", field: "totalFollowers" },
            { label: "Projects", field: "projectCount" }
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
            { label: "Stars", field: "totalStars" },
            { label: "Projects", field: "projectCount" }
        ]
    },
    spigot: {
        resource: [
            { label: "Downloads", field: "downloads" },
            { label: "Likes", field: "likes" },
            { label: "Rating", field: "rating" }
        ],
        author: [
            { label: "Downloads", field: "totalDownloads" },
            { label: "Resources", field: "resourceCount" },
            { label: "Rating", field: "avgRating" }
        ]
    }
};

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
                project: "Project not found",
                user: "User not found",
                organization: "Organization not found",
                collection: "Collection not found",
                mod: "Project not found"
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
    },
    spigot: {
        id: "spigot",
        name: "Spigot",
        defaultColor: "#E8A838",
        icon: (color) => ICONS.spigotPlatform(color),
        iconViewBox: PLATFORM_ICON_VIEWBOXES.spigot,
        labels: {
            stats: {
                downloads: "Downloads",
                followers: "Likes",
                stars: "Likes",
                rank: "Rating",
                versions: "Versions",
                files: "Versions",
                projects: "Resources",
                rating: "Rating"
            },
            sections: {
                latestVersions: "Latest Versions",
                topProjects: "Top Resources"
            },
            errors: {
                project: "Resource not found",
                user: "Author not found",
                organization: "Organization not found",
                collection: "Collection not found",
                mod: "Resource not found",
                resource: "Resource not found",
                author: "Author not found"
            }
        },
        statConfigs: STAT_CONFIGS.spigot,
        terminology: {
            versions: "versions",
            versionField: "date_published"
        }
    }
};

export function getPlatformConfig(platformId) {
    return PLATFORM_CONFIGS[platformId] || null;
}

export function getStatConfigs(platformId, entityType) {
    const platform = PLATFORM_CONFIGS[platformId];
    if (!platform) return null;

    // Map entity types for stat configs
    let statKey = entityType;
    if (platformId === "curseforge" && entityType === "mod") {
        statKey = "mod";
    } else if (platformId === "spigot") {
        // Spigot uses "resource" and "author" instead of "project" and "user"
        if (entityType === "resource") {
            statKey = "resource";
        } else if (entityType === "user" || entityType === "author") {
            statKey = "author";
        }
    } else if (!platform.statConfigs[entityType]) {
        return null;
    }

    return platform.statConfigs[statKey] || null;
}

export function getErrorMessage(platformId, entityType) {
    const platform = PLATFORM_CONFIGS[platformId];
    if (!platform) return "Resource not found";

    // Map entity types for error messages
    let errorKey = entityType;
    if (platformId === "curseforge" && entityType === "project") {
        errorKey = "mod";
    } else if (platformId === "spigot") {
        // Spigot uses "resource" and "author"
        if (entityType === "resource") {
            errorKey = "resource";
        } else if (entityType === "author") {
            errorKey = "author";
        }
    }

    return platform.labels.errors[errorKey] || "Resource not found";
}

export const ENTITY_ICONS = {
    project: "box",
    user: "user",
    organization: "building",
    collection: "collection",
    mod: "box", // CurseForge mods use box icon
    resource: "box", // Spigot resources use box icon
    author: "user" // Spigot authors use user icon
};

export function getEntityIcon(entityType) {
    return ENTITY_ICONS[entityType] || "box";
}
