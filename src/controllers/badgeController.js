import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import { generateBadge } from "../generators/badge.js";
import { formatNumber } from "../utils/formatters.js";
import logger from "../utils/logger.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

const handleBadgeRequest = async (req, res, next, badgeType, getValue, getDataFunc) => {
    try {
        const identifier = req.params.username || req.params.slug || req.params.id;
        const color = req.query.color || "#1bd96a";
        const cacheKey = `badge:${badgeType}:${identifier}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${badgeType} badge for "${identifier}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await getDataFunc(identifier);
        const value = getValue(data.stats);
        const svg = generateBadge(badgeType, value, color);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${badgeType} badge for "${identifier}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        logger.warn(`Error showing ${badgeType} badge for "${req.params.username || req.params.slug || req.params.id}": ${err.message}`);
        next(err);
    }
};

// User badges
export const getUserDownloads = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Downloads", stats => formatNumber(stats.totalDownloads), modrinthClient.getUserStats.bind(modrinthClient));

export const getUserProjects = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Projects", stats => stats.projectCount.toString(), modrinthClient.getUserStats.bind(modrinthClient));

export const getUserFollowers = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Followers", stats => formatNumber(stats.totalFollowers), modrinthClient.getUserStats.bind(modrinthClient));

// Project badges
export const getProjectDownloads = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Downloads", stats => formatNumber(stats.downloads), modrinthClient.getProjectStats.bind(modrinthClient));

export const getProjectFollowers = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Followers", stats => formatNumber(stats.followers), modrinthClient.getProjectStats.bind(modrinthClient));

export const getProjectVersions = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Versions", stats => stats.versionCount.toString(), modrinthClient.getProjectStats.bind(modrinthClient));

// Organization badges
export const getOrganizationDownloads = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Downloads", stats => formatNumber(stats.totalDownloads), modrinthClient.getOrganizationStats.bind(modrinthClient));

export const getOrganizationProjects = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Projects", stats => stats.projectCount.toString(), modrinthClient.getOrganizationStats.bind(modrinthClient));

export const getOrganizationFollowers = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Followers", stats => formatNumber(stats.totalFollowers), modrinthClient.getOrganizationStats.bind(modrinthClient));

// Collection badges
export const getCollectionDownloads = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Downloads", stats => formatNumber(stats.totalDownloads), modrinthClient.getCollectionStats.bind(modrinthClient));

export const getCollectionProjects = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Projects", stats => stats.projectCount.toString(), modrinthClient.getCollectionStats.bind(modrinthClient));

export const getCollectionFollowers = (req, res, next) =>
    handleBadgeRequest(req, res, next, "Followers", stats => formatNumber(stats.totalFollowers), modrinthClient.getCollectionStats.bind(modrinthClient));
