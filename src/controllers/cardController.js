import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import { generateUserCard } from "../generators/userCard.js";
import { generateProjectCard } from "../generators/projectCard.js";
import { generateOrganizationCard } from "../generators/organizationCard.js";
import { generateCollectionCard } from "../generators/collectionCard.js";
import logger from "../utils/logger.js";
import { generatePng } from "../utils/generateImage.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

const CARD_CONFIGS = {
    user: {
        paramKey: "username",
        dataFetcher: (client, id, options) => client.getUserStats(id, options.maxProjects),
        generator: generateUserCard
    },
    project: {
        paramKey: "slug",
        dataFetcher: (client, id, options) => client.getProjectStats(id, options.maxVersions, options.showVersions),
        generator: generateProjectCard
    },
    organization: {
        paramKey: "id",
        dataFetcher: (client, id, options) => client.getOrganizationStats(id, options.maxProjects),
        generator: generateOrganizationCard
    },
    collection: {
        paramKey: "id",
        dataFetcher: (client, id, options) => client.getCollectionStats(id, options.maxProjects),
        generator: generateCollectionCard
    }
};

const handleCardRequest = async (req, res, next, cardType) => {
    try {
        const config = CARD_CONFIGS[cardType];
        const identifier = req.params[config.paramKey];
        const theme = req.query.theme || "dark";
        const format = req.query.format;

        // Parse customization options
        const options = {
            showProjects: req.query.showProjects !== "false",
            showVersions: req.query.showVersions !== "false",
            maxProjects: Math.min(Math.max(parseInt(req.query.maxProjects) || 5, 1), 50),
            maxVersions: Math.min(Math.max(parseInt(req.query.maxVersions) || 5, 1), 50),
            relativeTime: req.query.relativeTime !== "false",
            color: req.query.color ? `#${req.query.color.replace(/^#/, "")}` : null,
            backgroundColor: req.query.backgroundColor ? `#${req.query.backgroundColor.replace(/^#/, "")}` : null
        };

        const cacheKey = `${cardType}:${identifier}:${theme}:${JSON.stringify(options)}`;

        // Generate PNG for Discord bots or when format=png is requested
        if (req.isCrawler || format === "png") {
            const pngCacheKey = `${cacheKey}:png`;
            const cachedPng = cache.get(pngCacheKey);

            if (cachedPng) {
                logger.info(`Showing ${cardType} card for "${identifier}" (cached image)`);
                res.setHeader("Content-Type", "image/png");
                res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
                return res.send(cachedPng);
            }

            // Generate PNG from cached SVG or generate new one
            const svg = cache.get(cacheKey) || await (async () => {
                const data = await config.dataFetcher(modrinthClient, identifier, options);
                const generatedSvg = config.generator(data, theme, options);
                cache.set(cacheKey, generatedSvg);
                return generatedSvg;
            })();
            const pngBuffer = await generatePng(svg);

            logger.info(`Showing ${cardType} card for "${identifier}" (image)`);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(pngBuffer);
        }

        // Serve cached SVG
        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing ${cardType} card for "${identifier}" (cached)`);
            res.setHeader("Content-Type", "image/svg+xml");
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.send(cached);
        }

        const data = await config.dataFetcher(modrinthClient, identifier, options);
        const svg = config.generator(data, theme, options);

        cache.set(cacheKey, svg);

        logger.info(`Showing ${cardType} card for "${identifier}"`);
        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
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
