import modrinthClient from "../services/modrinthClient.js";
import cache from "../utils/cache.js";
import logger from "../utils/logger.js";

const MAX_AGE = Math.floor(cache.ttl / 1000);

export const getMeta = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const cacheKey = `meta:${type}:${id}`;

        const cached = cache.get(cacheKey);
        if (cached) {
            logger.info(`Showing meta for ${type} "${id}" (cached)`);
            res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
            return res.json(cached);
        }

        let name = id;

        if (type === "user") {
            const user = await modrinthClient.getUser(id);
            name = user.username;
        } else if (type === "project") {
            const project = await modrinthClient.getProject(id);
            name = project.title;
        } else if (type === "organization") {
            const org = await modrinthClient.getOrganization(id);
            name = org.name;
        } else if (type === "collection") {
            const collection = await modrinthClient.getCollection(id);
            name = collection.name;
        }

        const result = { name };
        cache.set(cacheKey, result);
        logger.info(`Showing meta for ${type} "${id}"`);

        res.setHeader("Cache-Control", `public, max-age=${MAX_AGE}`);
        res.json(result);
    } catch (err) {
        logger.warn(`Error fetching meta for "${req.params.type}" "${req.params.id}": ${err.message}`);
        next(err);
    }
};
