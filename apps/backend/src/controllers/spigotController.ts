import spigotClient from "../services/spigotClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour

export const getSpigotMeta = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type = "resource" } = req.query;

        // Validate id is a number
        if (!/^\d+$/.test(String(id))) {
            return res.status(400).json({ error: "Invalid spigot id: must be a number" });
        }

        const entityType = type === "author" ? "author" : "resource";
        const cacheKey = metaKey(PLATFORM.SPIGOT, entityType, id);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        let data;
        let result;

        if (entityType === "author") {
            const authorResponse = await spigotClient.getAuthor(id);
            data = authorResponse;

            const authorName = data?.name || id;
            result = {
                name: authorName,
                url: `https://www.spigotmc.org/resources/authors/${authorName}.${id}/`
            };
        } else {
            const resourceResponse = await spigotClient.getResource(id);
            data = resourceResponse;
            const resourceName = data?.name || id;
            result = {
                name: resourceName,
                url: `https://www.spigotmc.org/resources/${id}/`
            };
        }

        if (!data) {
            return res.status(404).json({ error: `${entityType} not found` });
        }

        apiCache.set(cacheKey, result);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        logger.warn({
            err,
            platform: PLATFORM.SPIGOT,
            identifier: req.params.id,
            entity: req.query.type === "author" ? "author" : "resource"
        }, "Error fetching meta");
        next(err);
    }
};
