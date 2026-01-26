import dotenv from "dotenv";
import { performance } from "perf_hooks";
import { fetchImageAsBase64 } from "../utils/imageFetcher.js";
import { BasePlatformClient } from "./baseClient.js";

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

// Default number of files to display
const DEFAULT_FILES_COUNT = 5;

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

    async getModFiles(modId, pageSize = 10)
    {
        return this.fetch(`/v1/mods/${modId}/files?pageSize=${pageSize}`);
    }

    /**
     * Get stats for a CurseForge mod (for card generation)
     * @param {number|string} modId - The mod ID
     * @param {number} maxFiles - Maximum files to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getModStats(modId, maxFiles = DEFAULT_FILES_COUNT, convertToPng = false)
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

        let imageConversionTime = 0;

        // Fetch mod logo if available
        if (mod?.logo?.url) {
            const result = await fetchImageAsBase64(mod.logo.url, convertToPng);
            mod.logo_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch files for the mod
        let versions = [];
        let totalFileCount = 0;
        try {
            const filesResponse = await this.getModFiles(modId, maxFiles);
            const allFiles = filesResponse.data || [];
            // Use pagination totalCount if available, otherwise use the array length
            totalFileCount = filesResponse.pagination?.totalCount ?? allFiles.length;

            // Sort by date (newest first) and take maxFiles
            versions = allFiles
                .sort((a, b) => new Date(b.fileDate) - new Date(a.fileDate))
                .slice(0, maxFiles)
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
     * Get badge stats for a CurseForge mod (lightweight, no files)
     * @param {number|string} modId - The mod ID
     * @param {boolean} fetchFiles - Whether to fetch files for version count
     */
    async getModBadgeStats(modId, fetchFiles = false)
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

        let apiTime = performance.now() - apiStart;

        const stats = {
            downloads: mod?.downloadCount || 0,
            rank: mod?.gamePopularityRank || null,
            versionCount: 0,
            fileCount: 0
        };

        // Only fetch files if specifically requested (for file count badge)
        if (fetchFiles) {
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
            apiTime = performance.now() - apiStart;
        }

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
     * Check if API key is configured
     */
    isConfigured()
    {
        return !!CURSEFORGE_API_KEY;
    }
}

export default new CurseforgeClient();
