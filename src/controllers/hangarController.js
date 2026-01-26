import hangarClient from "../services/hangarClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour;

// Hangar meta endpoint
export const getHangarMeta = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const cacheKey = metaKey(PLATFORM.HANGAR, "project", slug);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Showing Hangar meta for project "${slug}" (cached ${minutesAgo}m ago)`);
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        const projectResponse = await hangarClient.getProject(slug);
        const project = projectResponse;
        const name = project?.name || slug;

        const result = { name };
        apiCache.set(cacheKey, result);
        logger.info(`Showing Hangar meta for project "${slug}"`);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        logger.warn(`Error fetching Hangar meta for project "${req.params.slug}": ${err.message}`);
        next(err);
    }
};
