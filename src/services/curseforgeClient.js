import dotenv from "dotenv";
import { performance } from "perf_hooks";
import { fetchImageAsBase64, fetchVersionDatesForProjects } from "../utils/imageFetcher.js";
import { BasePlatformClient } from "./baseClient.js";
import { CARD_LIMITS } from "../constants/platformConfig.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const CURSEFORGE_API_URL = process.env.CURSEFORGE_API_URL || "https://api.curseforge.com";
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY;
const USER_AGENT = process.env.USER_AGENT;

// Known loader names (for detecting loaders in gameVersions array)
const KNOWN_LOADERS = ["Forge", "Fabric", "NeoForge", "Quilt", "Rift", "LiteLoader", "Cauldron", "ModLoader", "Canvas", "Iris", "OptiFine", "Sodium"];

// Tags to filter out from game versions (not actual game versions)
const FILTERED_TAGS = ["Client", "Server", "Singleplayer", "Java"];

// CurseForge gameVersionTypeId to loader name mapping (for extracting loaders from sortableGameVersions)
// These are type IDs that represent mod loaders rather than game versions
const GAME_VERSION_TYPE_IDS = {
    68441: "NeoForge",
};

export class CurseforgeClient extends BasePlatformClient
{
    constructor()
    {
        super("CurseForge", {
            baseUrl: CURSEFORGE_API_URL,
            apiKey: CURSEFORGE_API_KEY,
            userAgent: USER_AGENT ? USER_AGENT.replace("{version}", VERSION) : undefined
        });
    }

    getHeaders()
    {
        const headers = super.getHeaders();
        if (this.apiKey) {
            headers["x-api-key"] = this.apiKey;
        }
        return headers;
    }

    async getMod(modId)
    {
        return this.fetch(`/v1/mods/${modId}`);
    }

    async getModFiles(modId, pageSize = CARD_LIMITS.MAX_COUNT)
    {
        return this.fetch(`/v1/mods/${modId}/files?pageSize=${pageSize}`);
    }

    /**
     * Get stats for a CurseForge mod (for card generation)
     * @param {number|string} modId - The mod ID
     * @param {number} maxFiles - Maximum files to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getModStats(modId, convertToPng = false)
    {
        // Validate modId is a number
        if (!/^\d+$/.test(String(modId))) {
            return null; // Return null instead of throwing to avoid stack trace
        }

        const apiStart = performance.now();

        const modResponse = await this.getMod(modId);
        if (!modResponse) {
            return null; // Return null instead of throwing to avoid stack trace
        }
        const mod = modResponse.data;
        if (!mod) {
            return null;
        }

        let imageConversionTime = 0;

        // Fetch mod logo if available and store as icon_url_base64 for consistency with unified system
        if (mod?.logo?.url) {
            const result = await fetchImageAsBase64(mod.logo.url, convertToPng);
            mod.icon_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch files for the mod (always fetch max for caching, card generator slices to maxVersions)
        let versions = [];
        let totalFileCount = 0;
        try {
            const filesResponse = await this.getModFiles(modId, CARD_LIMITS.MAX_COUNT);
            const allFiles = filesResponse.data || [];
            // Use pagination totalCount if available, otherwise use the array length
            totalFileCount = filesResponse.pagination?.totalCount ?? allFiles.length;

            // Sort by date (newest first) and take max (card generator will slice to maxVersions)
            versions = allFiles
                .sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))
                .slice(0, CARD_LIMITS.MAX_COUNT)
                .map(file => {
                    // Extract loaders from sortableGameVersions based on gameVersionTypeId
                    const loadersFromTypeId = (file.sortableGameVersions || [])
                        .map(v => GAME_VERSION_TYPE_IDS[v.gameVersionTypeId])
                        .filter(Boolean);

                    // Also extract loaders from gameVersions array by matching known loader names
                    const loadersFromGameVersions = (file.gameVersions || [])
                        .filter(v => KNOWN_LOADERS.includes(v));

                    // Combine and deduplicate
                    const loaders = [...new Set([...loadersFromTypeId, ...loadersFromGameVersions])];

                    // Filter out loader names and other tags from game versions so only actual game versions remain
                    const gameVersionsOnly = (file.gameVersions || [])
                        .filter(v => !KNOWN_LOADERS.includes(v) && !FILTERED_TAGS.includes(v));

                    return {
                        version_number: file.displayName || file.fileName,
                        date_published: file.fileDate,
                        loaders: loaders,
                        game_versions: gameVersionsOnly,
                        downloads: file.downloadCount || 0
                    };
                });
        } catch {
            // If files fetch fails, continue with empty versions array
            versions = [];
        }

        const apiTime = performance.now() - apiStart;

        return {
            project: mod, // Use 'project' key for consistency with unified system
            versions, // Use 'versions' key for consistency (instead of 'files')
            stats: {
                downloads: mod?.downloadCount || 0,
                rank: mod?.gamePopularityRank || null,
                versionCount: totalFileCount, // Use 'versionCount' for consistency
                fileCount: totalFileCount // Keep for backward compatibility
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a CurseForge mod
     * @param {number|string} modId - The mod ID
     */
    async getModBadgeStats(modId)
    {
        // Validate modId is a number
        if (!/^\d+$/.test(String(modId))) {
            return null; // Return null instead of throwing to avoid stack trace
        }

        const apiStart = performance.now();

        const modResponse = await this.getMod(modId);
        if (!modResponse) {
            return null; // Return null instead of throwing to avoid stack trace
        }
        const mod = modResponse.data;
        if (!mod) {
            return null;
        }

        const stats = {
            downloads: mod?.downloadCount || 0,
            rank: mod?.gamePopularityRank || null,
            versionCount: 0,
            fileCount: 0
        };

        // Fetch files
        try {
            const filesResponse = await this.getModFiles(modId);
            // Use pagination totalCount if available, otherwise use the array length
            const count = filesResponse.pagination?.totalCount ?? filesResponse.data?.length ?? 0;
            stats.versionCount = count; // Use versionCount for consistency
            stats.fileCount = count;
        } catch {
            stats.fileCount = 0;
            stats.versionCount = 0;
        }

        const apiTime = performance.now() - apiStart;
        return { stats, timings: { api: apiTime } };
    }

    /**
     * Search for a mod by slug and return its ID
     * @param {string} slug - The project slug
     * @returns {Promise<number>} The project ID
     */
    async searchModBySlug(slug)
    {
        // CurseForge search API
        const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&slug=${encodeURIComponent(slug)}`;

        const response = await this.fetch(searchUrl);
        const data = response.data;

        if (!data || data.length === 0) {
            throw new Error(`Mod not found: ${slug}`);
        }

        return data[0].id;
    }

    /**
     * Get CurseForge user ID from username by searching for their projects
     * @param {string} username - The username to look up
     * @returns {Promise<string>} The user ID
     */
    async getUserIdFromUsername(username)
    {
        const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&searchFilter=${encodeURIComponent(username)}&pageSize=50&sortField=2&sortOrder=desc`;

        const response = await this.fetch(searchUrl);
        const results = response.data || [];

        // Try to find a project where author name matches
        const matchingProject = results.find(mod => {
            if (!mod.authors) return false;
            return mod.authors.some(author =>
                author.name?.toLowerCase() === username.toLowerCase()
            );
        });

        if (matchingProject && matchingProject.authors) {
            const matchingAuthor = matchingProject.authors.find(author =>
                author.name?.toLowerCase() === username.toLowerCase()
            );
            if (matchingAuthor && matchingAuthor.id) {
                return String(matchingAuthor.id);
            }
        }

        // Fallback: Check for partial name match
        for (const mod of results) {
            if (mod.authors) {
                for (const author of mod.authors) {
                    if (author.name &&
                        (author.name.toLowerCase() === username.toLowerCase() ||
                         author.name.toLowerCase().replace(/[^a-z0-9]/g, "") === username.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
                        return String(author.id);
                    }
                }
            }
        }

        throw new Error("User not found");
    }

    /**
     * Get username from user ID by searching for their projects
     * @param {number|string} userId - The user ID
     * @returns {Promise<string|null>} The username or null if not found
     */
    async getUsernameFromUserId(userId)
    {
        const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&authorId=${userId}&pageSize=1`;

        const response = await this.fetch(searchUrl);
        const results = response.data || [];

        if (results.length > 0 && results[0].authors) {
            const author = results[0].authors.find(a => String(a.id) === String(userId));
            if (author && author.name) {
                return author.name;
            }
        }

        return null;
    }

    async getUser(userId)
    {
        return this.fetch(`/v1/users/${userId}`);
    }

    /**
     * Get stats for a CurseForge user (for card generation)
     * @param {number|string} userId - The user ID
     * @param {number} maxProjects - Maximum projects to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getUserStats(userId, convertToPng = false)
    {
        // Validate userId is a number
        if (!/^\d+$/.test(String(userId))) {
            return null;
        }

        const apiStart = performance.now();

        const userResponse = await this.getUser(userId);
        if (!userResponse) {
            return null;
        }
        const user = userResponse.data;
        if (!user) {
            return null;
        }

        let imageConversionTime = 0;

        // Fetch user avatar if available
        if (user?.avatarUrl) {
            // Replace {0} placeholder in Twitch avatar URLs with actual size
            const avatarUrl = user.avatarUrl.replace("{0}", "300x300");
            const result = await fetchImageAsBase64(avatarUrl, convertToPng);
            user.avatar_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch user's projects using search API with authorId
        let projects = [];
        let projectCount = 0;
        try {
            const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&authorId=${userId}&pageSize=${maxProjects}&sortField=6&sortOrder=desc`;
            const searchResponse = await this.fetch(searchUrl);
            const searchResults = searchResponse.data || [];

            // Get total project count from pagination
            projectCount = searchResponse.pagination?.totalCount || searchResults.length;

            // Map projects to standard format
            projects = await Promise.all(searchResults.map(async (mod) => {
                let icon_url_base64 = null;

                // Fetch project icon if available
                if (mod?.logo?.url) {
                    const result = await fetchImageAsBase64(mod.logo.url, convertToPng);
                    icon_url_base64 = result?.data;
                    if (result?.conversionTime) imageConversionTime += result.conversionTime;
                }

                // Fetch latest file to extract loaders
                let loaders = [];
                try {
                    const filesResponse = await this.getModFiles(mod.id, 1);
                    const files = filesResponse.data || [];
                    if (files.length > 0) {
                        const latestFile = files[0];
                        // Extract loaders from sortableGameVersions based on gameVersionTypeId
                        const loadersFromTypeId = (latestFile.sortableGameVersions || [])
                            .map(v => GAME_VERSION_TYPE_IDS[v.gameVersionTypeId])
                            .filter(Boolean);

                        // Also extract loaders from gameVersions array by matching known loader names
                        const loadersFromGameVersions = (latestFile.gameVersions || [])
                            .filter(v => KNOWN_LOADERS.includes(v));

                        // Combine and deduplicate
                        loaders = [...new Set([...loadersFromTypeId, ...loadersFromGameVersions])];
                    }
                } catch {
                    // If file fetch fails, continue without loaders
                }

                return {
                    id: mod.id,
                    title: mod.name,
                    slug: mod.slug,
                    description: mod.summary,
                    downloads: mod.downloadCount || 0,
                    followers: 0, // CurseForge doesn't have followers for mods
                    date_created: mod.dateCreated,
                    icon_url_base64: icon_url_base64,
                    icon: mod.logo?.url || null,
                    loaders: loaders
                };
            }));

            // Fetch version dates for sparkline
            await fetchVersionDatesForProjects(projects, async (modId) => {
                const filesResponse = await this.getModFiles(modId, 50);
                const files = filesResponse.data || [];
                return files.map(file => ({
                    date_published: file.fileDate
                }));
            });
        } catch {
            // If project fetch fails, continue with empty projects array
            projects = [];
        }

        // Collect all version dates for sparkline
        const allVersionDates = projects.flatMap(p => p.versionDates || []);

        // Map CurseForge user fields to standard format
        const mappedUser = {
            name: user.displayName,
            username: user.displayName,
            avatar_url_base64: user.avatar_url_base64,
            avatarUrl: user.avatarUrl?.replace("{0}", "300x300"),
            date_created: user.dateCreated
        };

        // Calculate total downloads from projects (if available) or use user's total
        const projectsDownloads = projects.reduce((sum, p) => sum + (p.downloads || 0), 0);
        const totalDownloads = user?.modsDownloadCount || projectsDownloads;

        const apiTime = performance.now() - apiStart;

        return {
            user: mappedUser,
            projects: projects,
            stats: {
                totalDownloads: totalDownloads,
                projectCount: projectCount,
                totalFollowers: user?.followerCount || 0,
                allVersionDates: allVersionDates
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a CurseForge user
     * @param {number|string} userId - The user ID
     */
    async getUserBadgeStats(userId)
    {
        // Validate userId is a number
        if (!/^\d+$/.test(String(userId))) {
            return null;
        }

        const apiStart = performance.now();

        const userResponse = await this.getUser(userId);
        if (!userResponse) {
            return null;
        }
        const user = userResponse.data;
        if (!user) {
            return null;
        }

        // Fetch project count
        let projectCount = 0;
        try {
            const searchUrl = `${CURSEFORGE_API_URL}/v1/mods/search?gameId=432&authorId=${userId}&pageSize=1`;
            const searchResponse = await this.fetch(searchUrl);
            projectCount = searchResponse.pagination?.totalCount || 0;
        } catch {
            projectCount = 0;
        }

        const apiTime = performance.now() - apiStart;

        return {
            stats: {
                totalDownloads: user?.modsDownloadCount || 0,
                projectCount: projectCount,
                totalFollowers: user?.followerCount || 0
            },
            timings: { api: apiTime }
        };
    }

    /**
     * Check if API key is configured
     */
    isConfigured()
    {
        return !!CURSEFORGE_API_KEY;
    }
}

export default new CurseforgeClient();
