import modrinthClient from "../services/modrinthClient.js";
import curseforgeClient from "../services/curseforgeClient.js";
import { apiCache } from "../utils/cache.js";
import { generateBadge } from "../generators/badge.js";
import { formatNumber } from "../utils/formatters.js";
import logger from "../utils/logger.js";
import { generatePng } from "../utils/generateImage.js";
import { modrinthKeys, curseforgeKeys } from "../utils/cacheKeys.js";
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
    curseforge_mod: {
        downloads: { label: "Downloads", getValue: stats => formatNumber(stats.downloads) },
        rank: { label: "Rank", getValue: stats => stats.rank ? `#${stats.rank}` : "N/A" },
        versions: { label: "Files", getValue: stats => stats.fileCount.toString() }
    }
};

const DATA_FETCHERS = {
    // Modrinth fetchers
    user: modrinthClient.getUserBadgeStats.bind(modrinthClient),
    project: modrinthClient.getProjectBadgeStats.bind(modrinthClient),
    organization: modrinthClient.getOrganizationBadgeStats.bind(modrinthClient),
    collection: modrinthClient.getCollectionBadgeStats.bind(modrinthClient),
    // CurseForge fetchers
    curseforge_mod: curseforgeClient.getModBadgeStats.bind(curseforgeClient)
};

// Platform and cache key mapping for each entity type
const ENTITY_CONFIG = {
    user: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", cacheKeyFn: modrinthKeys.userBadge },
    project: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", cacheKeyFn: modrinthKeys.projectBadge },
    organization: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", cacheKeyFn: modrinthKeys.organizationBadge },
    collection: { platform: PLATFORMS.MODRINTH.id, platformName: "modrinth", cacheKeyFn: modrinthKeys.collectionBadge },
    curseforge_mod: { platform: PLATFORMS.CURSEFORGE.id, platformName: "curseforge", cacheKeyFn: curseforgeKeys.modBadge }
};

const handleBadgeRequest = async (req, res, next, entityType, badgeType) => {
    try {
        const entityConfig = ENTITY_CONFIG[entityType];
        const platform = entityConfig.platform;
        const identifier = req.params.username || req.params.slug || req.params.id || req.params.modId;
        const format = req.query.format;
        const defaultColor = platform === PLATFORMS.CURSEFORGE.id ? PLATFORMS.CURSEFORGE.defaultColor : PLATFORMS.MODRINTH.defaultColor;
        const color = req.query.color ? `#${req.query.color.replace(/^#/, "")}` : defaultColor;
        const backgroundColor = req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null;
        const config = BADGE_CONFIGS[entityType][badgeType];

        // Determine if we need to render the svg as a image
        const renderImage = req.isImageCrawler || format === "png";

        // API data cache key - independent of styling options
        const apiCacheKey = entityConfig.cacheKeyFn(identifier);

        // Check for cached stats data
        let cached = apiCache.getWithMeta(apiCacheKey);
        let data = cached?.value;
        let fromCache = !!data;

        if (!data) {
            // Only fetch versions for version count badges
            const fetchVersions = (entityType === "project" || entityType === "curseforge_mod") && badgeType === "versions";
            data = await DATA_FETCHERS[entityType](identifier, fetchVersions);
            apiCache.set(apiCacheKey, data);
        }

        // Calculate cache age
        let cacheAge = null;
        if (fromCache && cached?.cachedAt) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            cacheAge = `${minutesAgo}m ago`;
        }

        // Always regenerate the badge from cached data
        const value = config.getValue(data.stats);
        const svg = generateBadge(config.label, value, platform, color, backgroundColor, fromCache);

        // Generate PNG for Discord bots or when format=png is requested
        if (renderImage) {
            const { buffer: pngBuffer, renderTime } = await generatePng(svg);

            const apiTime = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
            const pngTime = `${Math.round(renderTime)}ms`;
            const crawlerType = req.crawlerType;
            const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
            const size = `${(Buffer.byteLength(pngBuffer) / 1024).toFixed(1)} KB`;

            logger.info(`Showing ${entityConfig.platformName} ${entityType} ${badgeType} badge for "${identifier}" (api: ${apiTime}, render: ${pngTime}${crawlerLog}, size: ${size})`);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
            return res.send(pngBuffer);
        }

        // Return SVG
        const apiTime = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
        const crawlerType = req.crawlerType;
        const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
        const size = `${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`;
        logger.info(`Showing ${entityConfig.platformName} ${entityType} ${badgeType} badge for "${identifier}" (api: ${apiTime}${crawlerLog}, size: ${size})`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
        res.send(svg);
    } catch (err) {
        const identifier = req.params.username || req.params.slug || req.params.id || req.params.modId;
        logger.warn(`Error showing ${entityConfig.platformName} ${badgeType} badge for "${identifier}": ${err.message}`);
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
export const getCfModDownloads = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_mod", "downloads");
export const getCfModRank = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_mod", "rank");
export const getCfModVersions = (req, res, next) => handleBadgeRequest(req, res, next, "curseforge_mod", "versions");
