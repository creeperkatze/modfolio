import modrinthClient from "../services/modrinthClient.js";
import { apiCache } from "../utils/cache.js";
import { generateBadge } from "../generators/badge.js";
import { formatNumber } from "../utils/formatters.js";
import logger from "../utils/logger.js";

const API_CACHE_TTL = 3600; // 1 hour

const BADGE_CONFIGS = {
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
    }
};

const DATA_FETCHERS = {
    user: modrinthClient.getUserBadgeStats.bind(modrinthClient),
    project: modrinthClient.getProjectBadgeStats.bind(modrinthClient),
    organization: modrinthClient.getOrganizationBadgeStats.bind(modrinthClient),
    collection: modrinthClient.getCollectionBadgeStats.bind(modrinthClient)
};

const handleBadgeRequest = async (req, res, next, entityType, badgeType) => {
    try {
        const identifier = req.params.username || req.params.slug || req.params.id;
        const color = req.query.color ? `#${req.query.color.replace(/^#/, "")}` : "#1bd96a";
        const backgroundColor = req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null;
        const config = BADGE_CONFIGS[entityType][badgeType];

        // API data cache key - independent of styling options
        const apiCacheKey = `badge:${entityType}:${identifier}`;

        // Check for cached stats data
        let cached = apiCache.getWithMeta(apiCacheKey);
        let data = cached?.value;
        let fromCache = !!data;

        if (!data) {
            // Only fetch versions for version count badges
            const fetchVersions = entityType === "project" && badgeType === "versions";
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
        const svg = generateBadge(config.label, value, color, backgroundColor);

        const apiTime = fromCache ? `cached (${cacheAge})` : "N/A";
        const crawlerType = req.crawlerType;
        const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
        logger.info(`Showing ${entityType} ${badgeType} badge for "${identifier}" (api: ${apiTime}${crawlerLog})`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.send(svg);
    } catch (err) {
        const identifier = req.params.username || req.params.slug || req.params.id;
        logger.warn(`Error showing ${badgeType} badge for "${identifier}": ${err.message}`);
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
