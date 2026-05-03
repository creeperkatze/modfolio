import curseforgeClient from "../services/curseforgeClient.js";
import { apiCache } from "../utils/cache.js";
import logger from "../utils/logger.js";
import { curseforgeKeys, metaKey, PLATFORM } from "../utils/cacheKeys.js";

const API_CACHE_TTL = 3600; // 1 hour

/**
 * Get cached username for a user ID, or fetch it via search API
 */
async function getUsernameSlug(userId) {
    // Check cache first
    const cacheKey = curseforgeKeys.userIdLookup(userId);
    const cached = apiCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch username by searching for the user's projects
    const username = await curseforgeClient.getUsernameFromUserId(userId);
    if (username) {
        // Cache the username for future use
        apiCache.set(cacheKey, username);
    }
    return username;
}

export const getCfUserLookup = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        if (/^\d+$/.test(username)) {
            return res.json({ id: username });
        }

        const cacheKey = curseforgeKeys.userLookup(username);
        const cached = apiCache.getWithMeta(cacheKey);

        if (cached?.value) {
            const message = `Showing ${PLATFORM.CURSEFORGE} user lookup`;
            const cacheAgeMs = Date.now() - cached.cachedAt;
            logger.info({
                target: { platform: PLATFORM.CURSEFORGE, entity: "user", identifier: username, surface: "lookup" },
                cache: { hit: true, cachedAt: cached.cachedAt, ageMs: cacheAgeMs, ageSeconds: Math.round(cacheAgeMs / 1000) }
            }, message);
            return res.json({ id: cached.value });
        }

        const userId = await curseforgeClient.getUserIdFromUsername(username);
        apiCache.set(cacheKey, userId);
        const message = `Showing ${PLATFORM.CURSEFORGE} user lookup`;
        logger.info({
            target: { platform: PLATFORM.CURSEFORGE, entity: "user", identifier: username, surface: "lookup" },
            cache: { hit: false }
        }, message);

        // Cache reverse mapping (ID -> username) for profile URL generation
        const reverseCacheKey = curseforgeKeys.userIdLookup(userId);
        apiCache.set(reverseCacheKey, username);

        res.json({ id: userId });
    } catch (err) {
        const message = `Could not show ${PLATFORM.CURSEFORGE} user lookup`;
        logger.warn({
            target: { platform: PLATFORM.CURSEFORGE, entity: "user", identifier: req.params.username, surface: "lookup" },
            err
        }, message);
        res.status(404).json({ error: "User not found", message: err.message });
    }
};

export const getCfSlugLookup = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ error: "Slug is required" });
        }

        const cacheKey = curseforgeKeys.slugLookup(slug);
        const cached = apiCache.getWithMeta(cacheKey);

        if (cached?.value) {
            const message = `Showing ${PLATFORM.CURSEFORGE} project lookup`;
            const cacheAgeMs = Date.now() - cached.cachedAt;
            logger.info({
                target: { platform: PLATFORM.CURSEFORGE, entity: "project", identifier: slug, surface: "lookup" },
                cache: { hit: true, cachedAt: cached.cachedAt, ageMs: cacheAgeMs, ageSeconds: Math.round(cacheAgeMs / 1000) }
            }, message);
            return res.json({ id: cached.value });
        }

        const modId = await curseforgeClient.searchModBySlug(slug);
        apiCache.set(cacheKey, modId);
        const message = `Showing ${PLATFORM.CURSEFORGE} project lookup`;
        logger.info({
            target: { platform: PLATFORM.CURSEFORGE, entity: "project", identifier: slug, surface: "lookup" },
            cache: { hit: false }
        }, message);

        res.json({ id: modId });
    } catch (err) {
        const message = `Could not show ${PLATFORM.CURSEFORGE} project lookup`;
        logger.warn({
            target: { platform: PLATFORM.CURSEFORGE, entity: "project", identifier: req.params.slug, surface: "lookup" },
            err
        }, message);
        res.status(404).json({ error: "Project not found", message: err.message });
    }
};

export const getCurseforgeMeta = async (req, res, next) => {
    try {
        const { type, id } = req.params;

        if (type !== "project" && type !== "user") {
            return res.status(400).json({ error: `Invalid type: ${type}. Must be 'project' or 'user'` });
        }

        const cacheKey = metaKey(PLATFORM.CURSEFORGE, type, id);

        const cached = apiCache.getWithMeta(cacheKey);
        const cachedResult = cached?.value;

        if (cachedResult) {
            const message = `Showing ${PLATFORM.CURSEFORGE} ${type} meta`;
            const cacheAgeMs = Date.now() - cached.cachedAt;
            logger.info({
                target: { platform: PLATFORM.CURSEFORGE, entity: type, identifier: id, surface: "meta" },
                cache: { hit: true, cachedAt: cached.cachedAt, ageMs: cacheAgeMs, ageSeconds: Math.round(cacheAgeMs / 1000) }
            }, message);
            res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
            return res.json(cachedResult);
        }

        let name = id;
        let url = null;

        if (type === "user") {
            // Validate user id is a number
            if (!/^\d+$/.test(String(id))) {
                return res.status(400).json({ error: "Invalid curseforge user id: must be a number" });
            }

            const userResponse = await curseforgeClient.getUser(id);
            const user = userResponse.data;
            name = user?.displayName || id;

            // Get username slug for profile URL (fetches via search API if not cached)
            const usernameSlug = await getUsernameSlug(id);
            if (usernameSlug) {
                url = `https://www.curseforge.com/members/${usernameSlug}`;
            } else {
                url = null;
            }
        } else if (type === "project") {
            // Validate project id is a number
            if (!/^\d+$/.test(String(id))) {
                return res.status(400).json({ error: "Invalid curseforge project id: must be a number" });
            }

            const modResponse = await curseforgeClient.getMod(id);
            const mod = modResponse.data;
            name = mod?.name || id;
            url = mod?.links?.websiteUrl || null;
        }

        const result = { name, url };
        apiCache.set(cacheKey, result);
        const message = `Showing ${PLATFORM.CURSEFORGE} ${type} meta`;
        logger.info({
            target: { platform: PLATFORM.CURSEFORGE, entity: type, identifier: id, surface: "meta" },
            cache: { hit: false }
        }, message);

        res.setHeader("Cache-Control", `public, max-age=${API_CACHE_TTL}`);
        res.json(result);
    } catch (err) {
        const message = `Could not show ${PLATFORM.CURSEFORGE} ${req.params.type} meta`;
        logger.warn({
            target: { platform: PLATFORM.CURSEFORGE, entity: req.params.type, identifier: req.params.id, surface: "meta" },
            err
        }, message);
        next(err);
    }
};
