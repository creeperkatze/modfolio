import modrinthClient from "../services/modrinthClient.js";
import curseforgeClient from "../services/curseforgeClient.js";
import hangarClient from "../services/hangarClient.js";
import spigotClient from "../services/spigotClient.js";
import { apiCache } from "../utils/cache.js";
import { generateBadge } from "../generators/badge.js";
import { formatNumber } from "../utils/formatters.js";
import logger from "../utils/logger.js";
import { generatePng } from "../utils/generateImage.js";
import { modrinthKeys, curseforgeKeys, hangarKeys, spigotKeys } from "../utils/cacheKeys.js";
import { PLATFORMS } from "../constants/platforms.js";

const API_CACHE_TTL = 3600; // 1 hour

const BADGE_CONFIGS = {
    // Modrinth entities
    user: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        projects: { label: "Projects", getValue: stats => stats.projectCount.toString() },
        followers: { label: "Followers", getValue: stats => formatNumber(stats.totalFollowers) }
    },
    project: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.downloads) },
        followers: { label: "Followers", getValue: stats => formatNumber(stats.followers) },
        versions: { label: "Versions", getValue: stats => stats.versionCount.toString() }
    },
    organization: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        projects: { label: "Projects", getValue: stats => stats.projectCount.toString() },
        followers: { label: "Followers", getValue: stats => formatNumber(stats.totalFollowers) }
    },
    collection: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        projects: { label: "Projects", getValue: stats => stats.projectCount.toString() },
        followers: { label: "Followers", getValue: stats => formatNumber(stats.totalFollowers) }
    },
    // CurseForge entities
    curseforge_project: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.downloads) },
        rank: { label: "Rank", getValue: stats => stats.rank ? `#${stats.rank}` : "N/A" },
        versions: { label: "Files", getValue: stats => stats.fileCount.toString() }
    },
    curseforge_user: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        projects: { label: "Projects", getValue: stats => stats.projectCount.toString() },
        followers: { label: "Followers", getValue: stats => formatNumber(stats.totalFollowers) }
    },
    // Hangar entities
    hangar_project: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.downloads) },
        versions: { label: "Versions", getValue: stats => stats.versionCount.toString() },
        views: { label: "Views", getValue: stats => formatNumber(stats.views) }
    },
    hangar_user: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        projects: { label: "Projects", getValue: stats => stats.projectCount.toString() },
        stars: { label: "Stars", getValue: stats => formatNumber(stats.totalStars) }
    },
    // Spigot entities
    spigot_resource: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.downloads) },
        likes: { label: "Likes", getValue: stats => formatNumber(stats.likes) },
        rating: { label: "Rating", getValue: stats => stats.rating ? stats.rating.toFixed(1) : "N/A" },
        versions: { label: "Versions", getValue: stats => stats.versionCount.toString() }
    },
    spigot_author: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.totalDownloads) },
        resources: { label: "Resources", getValue: stats => stats.resourceCount.toString() },
        rating: { label: "Rating", getValue: stats => stats.avgRating ? stats.avgRating.toString() : "N/A" }
    }
};

const DATA_FETCHERS = {
    // Modrinth fetchers
    user: modrinthClient.getUserBadgeStats.bind(modrinthClient),
    project: modrinthClient.getProjectBadgeStats.bind(modrinthClient),
    organization: modrinthClient.getOrganizationBadgeStats.bind(modrinthClient),
    collection: modrinthClient.getCollectionBadgeStats.bind(modrinthClient),
    // CurseForge fetchers
    curseforge_project: curseforgeClient.getModBadgeStats.bind(curseforgeClient),
    curseforge_user: curseforgeClient.getUserBadgeStats.bind(curseforgeClient),
    // Hangar fetchers
    hangar_project: hangarClient.getProjectBadgeStats.bind(hangarClient),
    hangar_user: hangarClient.getUserBadgeStats.bind(hangarClient),
    // Spigot fetchers
    spigot_resource: spigotClient.getResourceBadgeStats.bind(spigotClient),
    spigot_author: spigotClient.getAuthorBadgeStats.bind(spigotClient)
};

// Platform and cache key mapping for each entity type
const ENTITY_CONFIG = {
    user: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", entityName: "user", cacheKeyFn: modrinthKeys.userBadge },
    project: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", entityName: "project", cacheKeyFn: modrinthKeys.projectBadge },
    organization: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", entityName: "organization", cacheKeyFn: modrinthKeys.organizationBadge },
    collection: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", entityName: "collection", cacheKeyFn: modrinthKeys.collectionBadge },
    curseforge_project: { platform: PLATFORMS.CURSEFORGE.id, platformName: "curseforge", entityName: "project", cacheKeyFn: curseforgeKeys.projectBadge },
    curseforge_user: { platform: PLATFORMS.CURSEFORGE.id, platformName: "curseforge", entityName: "user", cacheKeyFn: curseforgeKeys.userBadge },
    hangar_project: { platform: PLATFORMS.HANGAR.id, platformName: "hangar", entityName: "project", cacheKeyFn: hangarKeys.projectBadge },
    hangar_user: { platform: PLATFORMS.HANGAR.id, platformName: "hangar", entityName: "user", cacheKeyFn: hangarKeys.userBadge },
    spigot_resource: { platform: "spigot", platformName: "spigot", entityName: "resource", cacheKeyFn: spigotKeys.resourceBadge },
    spigot_author: { platform: "spigot", platformName: "spigot", entityName: "author", cacheKeyFn: spigotKeys.authorBadge }
};

const handleBadgeRequest = async (req, res, next, entityType, badgeType) => {
    try {
        const entityConfig = ENTITY_CONFIG[entityType];
        const platform = entityConfig.platform;
        const identifier = req.params.username || req.params.slug || req.params.id || req.params.projectId;
        const format = req.query.format;
        const defaultColor = platform === PLATFORMS.CURSEFORGE.id
            ? PLATFORMS.CURSEFORGE.defaultColor
            : platform === PLATFORMS.HANGAR.id
                ? PLATFORMS.HANGAR.defaultColor
                : platform === "spigot"
                    ? "#E8A838"
                    : PLATFORMS.MODRINTH.defaultColor;
        const color = req.query.color ? `#${req.query.color.replace(/^#/, "")}` : defaultColor;
        const backgroundColor = req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null;
        const badgeConfig = BADGE_CONFIGS[entityType][badgeType];

        // Determine if we need to render the svg as a image
        const renderImage = req.isImageCrawler || format === "png";

        // API data cache key - independent of styling options
        const apiCacheKey = entityConfig.cacheKeyFn(identifier);

        // Check for cached stats data
        let cached = apiCache.getWithMeta(apiCacheKey);
        let data = cached?.value;
        let fromCache = !!data;

        if (!data) {
            // Fetch from API (badge stats methods always fetch full data now)
            data = await DATA_FETCHERS[entityType](identifier);
            apiCache.set(apiCacheKey, data);
        }

        // Calculate cache age
        let cacheAge = null;
        if (fromCache && cached?.cachedAt) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            cacheAge = `${minutesAgo}m ago`;
        }

        // Always regenerate the badge from cached data
        const value = badgeConfig.getValue(data.stats);
        const svg = generateBadge(badgeConfig.label, value, platform, color, backgroundColor, fromCache);

        // Generate PNG for Discord bots or when format=png is requested
        if (renderImage) {
            const { buffer: pngBuffer, renderTime } = await generatePng(svg);

            const apiTimeLog = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
            const apiTimeHeader = fromCache ? "-1" : `${Math.round(data.timings.api)}ms`;
            const pngTime = `${Math.round(renderTime)}ms`;
            const crawlerLog = req.crawlerType ? `, crawler: ${req.crawlerType}` : "";
            const size = `${(Buffer.byteLength(pngBuffer) / 1024).toFixed(1)} KB`;

            logger.info(`Showing ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge for "${identifier}" (api: ${apiTimeLog}, render: ${pngTime}${crawlerLog}, size: ${size})`);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
            res.setHeader("X-API-Time", apiTimeHeader);
            return res.send(pngBuffer);
        }

        // Return SVG
        const apiTimeLog = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
        const apiTimeHeader = fromCache ? "-1" : `${Math.round(data.timings.api)}ms`;
        const crawlerLog = req.crawlerType ? `, crawler: ${req.crawlerType}` : "";
        const size = `${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`;
        logger.info(`Showing ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge for "${identifier}" (api: ${apiTimeLog}${crawlerLog}, size: ${size})`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
        res.setHeader("X-API-Time", apiTimeHeader);
        res.send(svg);
    } catch (err) {
        const identifier = req.params.username || req.params.slug || req.params.id || req.params.projectId;
        const entityConfig = ENTITY_CONFIG[entityType];
        logger.warn(`Error showing ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge for "${identifier}": ${err.message}`);
        next(err);
    }
};

// User badges
export const getUserDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "user", "downloads");
export const getUserProjects = (req, res, next) => handleBadgeRequest(req, res, next, "user", "projects");
export const getUserFollowers = (req, res, next) => handleBadgeRequest(req, res, next, "user", "followers");

// Project badges
export const getProjectDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "project", "downloads");
export const getProjectFollowers = (req, res, next) => handleBadgeRequest(req, res, next, "project", "followers");
export const getProjectVersions = (req, res, next) => handleBadgeRequest(req, res, next, "project", "versions");

// Organization badges
export const getOrganizationDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "organization", "downloads");
export const getOrganizationProjects = (req, res, next) => handleBadgeRequest(req, res, next, "organization", "projects");
export const getOrganizationFollowers = (req, res, next) => handleBadgeRequest(req, res, next, "organization", "followers");

// Collection badges
export const getCollectionDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "collection", "downloads");
export const getCollectionProjects = (req, res, next) => handleBadgeRequest(req, res, next, "collection", "projects");
export const getCollectionFollowers = (req, res, next) => handleBadgeRequest(req, res, next, "collection", "followers");

// CurseForge mod badges
export const getCfModDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_project", "downloads");
export const getCfModRank = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_project", "rank");
export const getCfModVersions = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_project", "versions");

// CurseForge user badges
export const getCfUserDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_user", "downloads");
export const getCfUserProjects = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_user", "projects");
export const getCfUserFollowers = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_user", "followers");

// Hangar project badges
export const getHangarProjectDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_project", "downloads");
export const getHangarProjectVersions = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_project", "versions");
export const getHangarProjectViews = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_project", "views");

// Hangar user badges
export const getHangarUserDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_user", "downloads");
export const getHangarUserProjects = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_user", "projects");
export const getHangarUserStars = (req, res, next) => handleBadgeRequest(req, res, next, "hangar_user", "stars");

// Spigot resource badges
export const getSpigotResourceDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_resource", "downloads");
export const getSpigotResourceLikes = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_resource", "likes");
export const getSpigotResourceRating = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_resource", "rating");
export const getSpigotResourceVersions = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_resource", "versions");

// Spigot author badges
export const getSpigotAuthorDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_author", "downloads");
export const getSpigotAuthorResources = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_author", "resources");
export const getSpigotAuthorRating = (req, res, next) => handleBadgeRequest(req, res, next, "spigot_author", "rating");
