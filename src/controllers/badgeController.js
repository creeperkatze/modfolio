import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import { generateBadge } from "../generators/badge.js";
import { formatNumber } from "../utils/formatters.js";
import logger from "../utils/logger.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

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
        const cacheKey = `badge:${config.label}:${identifier}:${color}:${backgroundColor || 'transparent'}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${config.label} badge for "${identifier}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        // Only fetch versions for version count badges
        const fetchVersions = entityType === "project" && badgeType === "versions";
        const data = await DATA_FETCHERS[entityType](identifier, fetchVersions);
        const value = config.getValue(data.stats);
        const svg = generateBadge(config.label, value, color, backgroundColor);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${config.label} badge for "${identifier}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
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
