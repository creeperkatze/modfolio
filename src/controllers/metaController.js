import modrinthClient from "../services/modrinthClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour

export const getMeta = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const cacheKey = metaKey(PLATFORM.MODRINTH, type, id);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            const minutesAgo = Math.round((Date.now() - cached.cachedAt) / 60000);
            logger.info(`Showing Modrinth meta for ${type} "${id}" (cached ${minutesAgo}m ago)`);
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        let name = id;
        let url = null;

        if (type === "user") {
            const user = await modrinthClient.getUser(id);
            name = user.username;
            url = `https://modrinth.com/user/${id}`;
        } else if (type === "project") {
            const project = await modrinthClient.getProject(id);
            name = project.title;
            url = `https://modrinth.com/${project.project_type}/${id}`;
        } else if (type === "organization") {
            const org = await modrinthClient.getOrganization(id);
            name = org.name;
            url = `https://modrinth.com/organization/${id}`;
        } else if (type === "collection") {
            const collection = await modrinthClient.getCollection(id);
            name = collection.name;
            url = `https://modrinth.com/collection/${id}`;
        }

        const result = { name, url };
        apiCache.set(cacheKey, result);
        logger.info(`Showing Modrinth meta for ${type} "${id}"`);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        logger.warn(`Error fetching meta for "${req.params.type}" "${req.params.id}": ${err.message}`);
        next(err);
    }
};
