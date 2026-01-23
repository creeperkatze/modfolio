import modrinthClient from "../services/modrinthClient.js";
import { apiCache } from "../utils/cache.js";
import { generateUserCard } from "../generators/userCard.js";
import { generateProjectCard } from "../generators/projectCard.js";
import { generateOrganizationCard } from "../generators/organizationCard.js";
import { generateCollectionCard } from "../generators/collectionCard.js";
import logger from "../utils/logger.js";
import { generatePng } from "../utils/generateImage.js";

const API_CACHE_TTL = 3600; // 1 hour

const CARD_CONFIGS = {
    user: {
        paramKey: "username",
        dataFetcher: (client, id, options, convertToPng) => client.getUserStats(id, options.maxProjects, convertToPng),
        generator: generateUserCard
    },
    project: {
        paramKey: "slug",
        dataFetcher: (client, id, options, convertToPng) => client.getProjectStats(id, options.maxVersions, convertToPng),
        generator: generateProjectCard
    },
    organization: {
        paramKey: "id",
        dataFetcher: (client, id, options, convertToPng) => client.getOrganizationStats(id, options.maxProjects, convertToPng),
        generator: generateOrganizationCard
    },
    collection: {
        paramKey: "id",
        dataFetcher: (client, id, options, convertToPng) => client.getCollectionStats(id, options.maxProjects, convertToPng),
        generator: generateCollectionCard
    }
};

const handleCardRequest = async (req, res, next, cardType) => {
    try {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        const format = req.query.format;

        // Determine if we need to render the svg as a image
        const renderImage = req.isImageCrawler || format === "png";

        // Parse customization options
        const options = {
            showProjects: req.query.showProjects !== "false",
            showVersions: req.query.showVersions !== "false",
            maxProjects: Math.min(Math.max(parseInt(req.query.maxProjects) || 5, 1), 50),
            maxVersions: Math.min(Math.max(parseInt(req.query.maxVersions) || 5, 1), 50),
            relativeTime: req.query.relativeTime !== "false",
            showSparklines: req.query.showSparklines !== "false",
            color: req.query.color ? `#${req.query.color.replace(/^#/, "")}` : null,
            backgroundColor: req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null
        };

        // API data cache key - simple, independent of styling options
        const apiCacheKey = `${cardType}:${identifier}`;

        // Check for cached API data
        let cached = apiCache.getWithMeta(apiCacheKey);
        let data = cached?.value;
        let fromCache = !!data;

        if (!data) {
            // Fetch from API with PNG images (works for both SVG and PNG output)
            data = await config.dataFetcher(modrinthClient, identifier, options, true);
            apiCache.set(apiCacheKey, data);
        }

        // Calculate cache age
        let cacheAge = null;
        if (fromCache && cached?.cachedAt) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            cacheAge = `${minutesAgo}m ago`;
        }

        // Always regenerate the output from cached data
        const svg = config.generator(data, options);

        // Generate PNG for Discord bots or when format=png is requested
        if (renderImage) {
            const { buffer: pngBuffer, renderTime } = await generatePng(svg);

            const apiTime = fromCache ? `cached (${cacheAge})` : (data.timings?.api ? `${Math.round(data.timings.api)}ms` : "N/A");
            const conversionTime = fromCache ? "cached" : (data.timings?.imageConversion ? `${Math.round(data.timings.imageConversion)}ms` : "N/A");
            const pngTime = `${Math.round(renderTime)}ms`;
            const crawlerType = req.crawlerType;
            const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";

            logger.info(`Showing ${cardType} card for "${identifier}" (api: ${apiTime}, image conversion: ${conversionTime}, render: ${pngTime}${crawlerLog})`);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.send(pngBuffer);
        }

        // Return SVG
        const apiTime = fromCache ? `cached (${cacheAge})` : (data.timings?.api ? `${Math.round(data.timings.api)}ms` : "N/A");
        const crawlerType = req.crawlerType;
        const crawlerLog = crawlerType ? `, crawler: ${crawlerType}` : "";
        logger.info(`Showing ${cardType} card for "${identifier}" (api: ${apiTime}${crawlerLog})`);
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.send(svg);
    } catch (err) {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        logger.warn(`Error showing ${cardType} card for "${identifier}": ${err.message}`);
        next(err);
    }
};

export const getUser = (req, res, next) => handleCardRequest(req, res, next, "user");
export const getProject = (req, res, next) => handleCardRequest(req, res, next, "project");
export const getOrganization = (req, res, next) => handleCardRequest(req, res, next, "organization");
export const getCollection = (req, res, next) => handleCardRequest(req, res, next, "collection");
