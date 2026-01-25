import curseforgeClient from "../services/curseforgeClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { curseforgeKeys, metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour;

// CurseForge meta endpoint
export const getCfMeta = async (req, res, next) => {
    try {
        const { modId } = req.params;
        const cacheKey = metaKey(PLATFORM.CURSEFORGE, "mod", modId);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Showing CurseForge meta for mod "${modId}" (cached ${minutesAgo}m ago)`);
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        const modResponse = await curseforgeClient.getMod(modId);
        const mod = modResponse.data;
        const name = mod?.name || modId;

        const result = { name };
        apiCache.set(cacheKey, result);
        logger.info(`Showing CurseForge meta for mod "${modId}"`);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        logger.warn(`Error fetching CurseForge meta for mod "${req.params.modId}": ${err.message}`);
        next(err);
    }
};

// CurseForge slug to ID lookup
export const getCfSlugLookup = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ error: "Slug is required" });
        }

        const cacheKey = curseforgeKeys.slugLookup(slug);
        const cached = apiCache.getWithMeta(cacheKey);

        if (cached?.value) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`CurseForge slug lookup for "${slug}" -> ID ${cached.value} (cached ${minutesAgo}m ago)`);
            return res.json({ id: cached.value });
        }

        const modId = await curseforgeClient.searchModBySlug(slug);
        apiCache.set(cacheKey, modId);
        logger.info(`CurseForge slug lookup for "${slug}" -> ID ${modId}`);

        res.json({ id: modId });
    } catch (err) {
        logger.warn(`Error looking up CurseForge slug "${req.params.slug}": ${err.message}`);
        res.status(404).json({ error: "Mod not found", message: err.message });
    }
};
