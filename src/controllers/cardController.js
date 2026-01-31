import modrinthClient from "../services/modrinthClient.js";
import curseforgeClient from "../services/curseforgeClient.js";
import hangarClient from "../services/hangarClient.js";
import spigotClient from "../services/spigotClient.js";
import { apiCache } from "../utils/cache.js";
import { generateCard } from "../generators/card.js";
import logger from "../utils/logger.js";
import { generatePng } from "../utils/generateImage.js";
import { modrinthKeys, curseforgeKeys, hangarKeys, spigotKeys } from "../utils/cacheKeys.js";
import { generateErrorCard } from "../middleware/errorHandler.js";
import { getErrorMessage, CARD_LIMITS } from "../constants/platformConfig.js";

const API_CACHE_TTL = 3600; // 1 hour

// Map card types to their API clients
const CARD_CLIENTS = {
    modrinth_user: modrinthClient,
    modrinth_project: modrinthClient,
    modrinth_organization: modrinthClient,
    modrinth_collection: modrinthClient,
    curseforge_project: curseforgeClient,
    curseforge_user: curseforgeClient,
    hangar_project: hangarClient,
    hangar_user: hangarClient,
    spigot_resource: spigotClient,
    spigot_author: spigotClient
};

const CARD_CONFIGS = {
    modrinth_user: {
        paramKey: "username",
        dataFetcher: (client, id, convertToPng) => client.getUserStats(id, convertToPng),
        cacheKeyFn: modrinthKeys.user,
        entityName: "user",
        platformId: "modrinth",
        useUnified: true
    },
    modrinth_project: {
        paramKey: "slug",
        dataFetcher: (client, id, convertToPng) => client.getProjectStats(id, convertToPng),
        cacheKeyFn: modrinthKeys.project,
        entityName: "project",
        platformId: "modrinth",
        useUnified: true
    },
    modrinth_organization: {
        paramKey: "id",
        dataFetcher: (client, id, convertToPng) => client.getOrganizationStats(id, convertToPng),
        cacheKeyFn: modrinthKeys.organization,
        entityName: "organization",
        platformId: "modrinth",
        useUnified: true
    },
    modrinth_collection: {
        paramKey: "id",
        dataFetcher: (client, id, convertToPng) => client.getCollectionStats(id, convertToPng),
        cacheKeyFn: modrinthKeys.collection,
        entityName: "collection",
        platformId: "modrinth",
        useUnified: true
    },
    curseforge_project: {
        paramKey: "projectId",
        dataFetcher: (client, id, convertToPng) => client.getModStats(id, convertToPng),
        cacheKeyFn: curseforgeKeys.project,
        entityName: "project",
        platformId: "curseforge",
        useUnified: true
    },
    curseforge_user: {
        paramKey: "id",
        dataFetcher: (client, id, convertToPng) => client.getUserStats(id, convertToPng),
        cacheKeyFn: curseforgeKeys.user,
        entityName: "user",
        platformId: "curseforge",
        useUnified: true
    },
    hangar_project: {
        paramKey: "slug",
        dataFetcher: (client, id, convertToPng) => client.getProjectStats(id, convertToPng),
        cacheKeyFn: hangarKeys.project,
        entityName: "project",
        platformId: "hangar",
        useUnified: true
    },
    hangar_user: {
        paramKey: "username",
        dataFetcher: (client, id, convertToPng) => client.getUserStats(id, convertToPng),
        cacheKeyFn: hangarKeys.user,
        entityName: "user",
        platformId: "hangar",
        useUnified: true
    },
    spigot_resource: {
        paramKey: "id",
        dataFetcher: (client, id, convertToPng) => client.getResourceStats(id, convertToPng),
        cacheKeyFn: spigotKeys.resource,
        entityName: "resource",
        platformId: "spigot",
        useUnified: true
    },
    spigot_author: {
        paramKey: "id",
        dataFetcher: (client, id, convertToPng) => client.getAuthorStats(id, convertToPng),
        cacheKeyFn: spigotKeys.author,
        entityName: "author",
        platformId: "spigot",
        useUnified: true
    }
};

const handleCardRequest = async (req, res, next, cardType) => {
    try {
        const config = CARD_CONFIGS[cardType];
        const client = CARD_CLIENTS[cardType];
        const identifier = req.params[config.paramKey];
        const format = req.query.format;

        // Determine if we need to render the svg as a image
        const renderImage = req.isImageCrawler || format === "png";

        // Parse customization options
        const options = {
            showProjects: req.query.showProjects !== "false",
            showVersions: req.query.showVersions !== "false",
            maxProjects: Math.min(Math.max(parseInt(req.query.maxProjects) || CARD_LIMITS.DEFAULT_COUNT, 1), CARD_LIMITS.MAX_COUNT),
            maxVersions: Math.min(Math.max(parseInt(req.query.maxVersions) || CARD_LIMITS.DEFAULT_COUNT, 1), CARD_LIMITS.MAX_COUNT),
            relativeTime: req.query.relativeTime !== "false",
            showSparklines: req.query.showSparklines !== "false",
            showDownloadBars: req.query.showDownloadBars !== "false",
            color: req.query.color ? `#${req.query.color.replace(/^#/, "")}` : null,
            backgroundColor: req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null
        };

        // API data cache key - simple, independent of styling options
        const apiCacheKey = config.cacheKeyFn(identifier);

        // Check for cached API data
        let cached = apiCache.getWithMeta(apiCacheKey);
        let data = cached?.value;
        let fromCache = !!data;

        if (!data) {
            // Fetch from API with PNG images (works for both SVG and PNG output)
            data = await config.dataFetcher(client, identifier, true);

            // Handle not found (null response) without throwing
            if (!data) {
                const errorMessage = getErrorMessage(config.platformId, config.entityName);

                logger.warn(`Error showing ${config.platformId} ${config.entityName} card for "${identifier}": ${errorMessage}`);

                // Generate error card with platform-specific branding
                const errorSvg = generateErrorCard(
                    errorMessage,
                    "",
                    config.platformId === "curseforge",
                    config.platformId === "hangar",
                    config.platformId === "spigot"
                );

                if (renderImage) {
                    const { buffer: pngBuffer } = await generatePng(errorSvg);
                    res.setHeader("Content-Type", "image/png");
                    res.setHeader("Cache-Control", "no-cache");
                    return req.isImageCrawler ? res.status(200).send(pngBuffer) : res.status(404).send(pngBuffer);
                }

                res.setHeader("Content-Type", "image/svg+xml");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("X-Error-Status", "404");
                return req.isImageCrawler ? res.status(200).send(errorSvg) : res.status(404).send(errorSvg);
            }

            apiCache.set(apiCacheKey, data);
        }

        // Calculate cache age
        let cacheAge = null;
        if (fromCache && cached?.cachedAt) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            cacheAge = `${minutesAgo}m ago`;
        }

        // Always regenerate the output from cached data
        options.fromCache = fromCache;

        // Use unified card generator for all platforms
        const svg = generateCard(data, config.platformId, config.entityName, options);

        // Generate PNG for bots or when format=png is requested
        if (renderImage) {
            const { buffer: pngBuffer, renderTime } = await generatePng(svg);

            const apiTimeLog = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
            const apiTimeHeader = fromCache ? "-1" : `${Math.round(data.timings.api)}ms`;
            const conversionTime = fromCache ? "cached" : `${Math.round(data.timings.imageConversion)}ms`;
            const pngTime = `${Math.round(renderTime)}ms`;
            const crawlerType = req.crawlerType;
            const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
            const size = `${(Buffer.byteLength(pngBuffer) / 1024).toFixed(1)} KB`;

            logger.info(`Showing ${config.platformId} ${config.entityName} card for "${identifier}" (api: ${apiTimeLog}, image conversion: ${conversionTime}, render: ${pngTime}${crawlerLog}, size: ${size})`);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
            res.setHeader("X-API-Time", apiTimeHeader);
            return res.send(pngBuffer);
        }

        // Return SVG
        const apiTimeLog = fromCache ? `cached (${cacheAge})` : `${Math.round(data.timings.api)}ms`;
        const apiTimeHeader = fromCache ? "-1" : `${Math.round(data.timings.api)}ms`;
        const crawlerType = req.crawlerType;
        const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
        const size = `${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`;
        logger.info(`Showing ${config.platformId} ${config.entityName} card for "${identifier}" (api: ${apiTimeLog}${crawlerLog}, size: ${size})`);
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.setHeader("X-Cache", fromCache ? "HIT" : "MISS");
        res.setHeader("X-API-Time", apiTimeHeader);
        res.send(svg);
    } catch (err) {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        logger.warn(`Error showing ${config.platformId} ${config.entityName} card for "${identifier}": ${err.message}`);
        next(err);
    }
};

export const getUser = (req, res, next) => handleCardRequest(req, res, next, "modrinth_user");
export const getProject = (req, res, next) => handleCardRequest(req, res, next, "modrinth_project");
export const getOrganization = (req, res, next) => handleCardRequest(req, res, next, "modrinth_organization");
export const getCollection = (req, res, next) => handleCardRequest(req, res, next, "modrinth_collection");

// CurseForge project card
export const getCfMod = (req, res, next) => handleCardRequest(req, res, next, "curseforge_project");

// CurseForge user card
export const getCfUser = (req, res, next) => handleCardRequest(req, res, next, "curseforge_user");

// Hangar project card
export const getHangarProject = (req, res, next) => handleCardRequest(req, res, next, "hangar_project");

// Hangar user card
export const getHangarUser = (req, res, next) => handleCardRequest(req, res, next, "hangar_user");

// Spigot resource card
export const getSpigotResource = (req, res, next) => handleCardRequest(req, res, next, "spigot_resource");

// Spigot author card
export const getSpigotAuthor = (req, res, next) => handleCardRequest(req, res, next, "spigot_author");
