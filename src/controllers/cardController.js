import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import { generateUserCard } from "../generators/userCard.js";
import { generateProjectCard } from "../generators/projectCard.js";
import { generateOrganizationCard } from "../generators/organizationCard.js";
import { generateCollectionCard } from "../generators/collectionCard.js";
import logger from "../utils/logger.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

const handleCardRequest = async (req, res, next, cardType, generator) => {
    try {
        const { username } = req.params;
        const theme = req.query.theme || "dark";
        const cacheKey = `${cardType}:${username}:${theme}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${username}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await modrinthClient.getUserStats(username);
        const svg = generator(data, theme);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${cardType} card for "${username}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        logger.warn(`Error showing ${cardType} card for "${req.params.username}": ${err.message}`);
        next(err);
    }
};

export const getUser = (req, res, next) =>
    handleCardRequest(req, res, next, "user", generateUserCard);

const handleProjectCardRequest = async (req, res, next, cardType, generator) => {
    try {
        const { slug } = req.params;
        const theme = req.query.theme || "dark";
        const cacheKey = `${cardType}:${slug}:${theme}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${slug}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await modrinthClient.getProjectStats(slug);
        const svg = generator(data, theme);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${cardType} card for "${slug}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        logger.warn(`Error showing ${cardType} card for "${req.params.slug}": ${err.message}`);
        next(err);
    }
};

export const getProject = (req, res, next) =>
    handleProjectCardRequest(req, res, next, "project", generateProjectCard);

const handleOrganizationCardRequest = async (req, res, next, cardType, generator) => {
    try {
        const { id } = req.params;
        const theme = req.query.theme || "dark";
        const cacheKey = `${cardType}:${id}:${theme}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${id}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await modrinthClient.getOrganizationStats(id);
        const svg = generator(data, theme);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${cardType} card for "${id}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        logger.warn(`Error showing ${cardType} card for "${req.params.id}": ${err.message}`);
        next(err);
    }
};

export const getOrganization = (req, res, next) =>
    handleOrganizationCardRequest(req, res, next, "organization", generateOrganizationCard);

const handleCollectionCardRequest = async (req, res, next, cardType, generator) => {
    try {
        const { id } = req.params;
        const theme = req.query.theme || "dark";
        const cacheKey = `${cardType}:${id}:${theme}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${id}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await modrinthClient.getCollectionStats(id);
        const svg = generator(data, theme);

        cache.set(cacheKey, svg);
        logger.info(`Showing ${cardType} card for "${id}"`);

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.send(svg);
    } catch (err) {
        logger.warn(`Error showing ${cardType} card for "${req.params.id}": ${err.message}`);
        next(err);
    }
};

export const getCollection = (req, res, next) =>
    handleCollectionCardRequest(req, res, next, "collection", generateCollectionCard);