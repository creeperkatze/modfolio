import dotenv from "dotenv";
import { performance } from "perf_hooks";
import { fetchImageAsBase64 } from "../utils/imageFetcher.js";
import { BasePlatformClient } from "./baseClient.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const SPIGOT_API_URL = process.env.SPIGOT_API_URL || "https://api.spiget.org";
const USER_AGENT = process.env.USER_AGENT;

// Default number of versions to display
const DEFAULT_VERSIONS_COUNT = 5;
// Always fetch this many versions for caching
const FETCH_VERSIONS_COUNT = 10;
// Default number of resources to display for authors
const DEFAULT_RESOURCES_COUNT = 5;

/**
 * Spigot API client for fetching resource data from Spigot (SpigotMC API)
 * API Documentation: https://api.spiget.org/
 */
export class SpigotClient extends BasePlatformClient
{
    constructor()
    {
        super("Spigot", {
            baseUrl: SPIGOT_API_URL,
            userAgent: USER_AGENT ? USER_AGENT.replace("{version}", VERSION) : undefined
        });
    }

    getHeaders()
    {
        const headers = super.getHeaders();
        return headers;
    }

    /**
     * Get resource data by ID
     * @param {number} resourceId - The resource ID
     * @returns {Promise<Object>} Resource data
     */
    async getResource(resourceId)
    {
        // Spigot API: GET /v2/resources/{resource}
        return this.fetch(`/v2/resources/${resourceId}`);
    }

    /**
     * Get resource versions
     * @param {number} resourceId - The resource ID
     * @param {number} limit - Maximum versions to fetch
     * @returns {Promise<Object>} Versions data
     */
    async getResourceVersions(resourceId, limit = 10)
    {
        // Spigot API: GET /v2/resources/{resource}/versions?size={limit}
        return this.fetch(`/v2/resources/${resourceId}/versions?size=${limit}&sort=-date`);
    }

    /**
     * Get author data by ID
     * @param {number} authorId - The author ID
     * @returns {Promise<Object>} Author data
     */
    async getAuthor(authorId)
    {
        // Spigot API: GET /v2/authors/{author}
        return this.fetch(`/v2/authors/${authorId}`);
    }

    /**
     * Get author's resources
     * @param {number} authorId - The author ID
     * @param {number} limit - Maximum resources to fetch
     * @returns {Promise<Object>} Resources data
     */
    async getAuthorResources(authorId, limit = 25)
    {
        // Spigot API: GET /v2/authors/{author}/resources?size={limit}
        return this.fetch(`/v2/authors/${authorId}/resources?size=${limit}&sort=-downloads`);
    }

    /**
     * Get stats for a Spigot resource (for card generation)
     * @param {number} resourceId - The resource ID
     * @param {number} maxVersions - Maximum versions to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getResourceStats(resourceId, maxVersions = DEFAULT_VERSIONS_COUNT, convertToPng = false)
    {
        // Validate resourceId is a number
        if (!/^\d+$/.test(String(resourceId))) {
            return null;
        }

        const apiStart = performance.now();

        const resourceResponse = await this.getResource(resourceId);
        if (!resourceResponse) {
            return null;
        }
        const resource = resourceResponse;

        let imageConversionTime = 0;

        // Fetch resource icon - Spiget API has separate icon endpoint
        const iconUrl = `${SPIGOT_API_URL}/v2/resources/${resourceId}/icon`;
        const result = await fetchImageAsBase64(iconUrl, convertToPng);
        resource.icon_url_base64 = result?.data;
        if (result?.conversionTime) imageConversionTime += result.conversionTime;

        // Fetch versions for the resource
        let versions = [];
        let totalVersionCount = 0;
        try {
            const versionsResponse = await this.getResourceVersions(resourceId, FETCH_VERSIONS_COUNT);
            const allVersions = versionsResponse || [];
            totalVersionCount = allVersions.length;

            // Sort by date (newest first) - card generator will slice to maxVersions
            versions = allVersions
                .sort((a, b) => (b.releaseDate || 0) - (a.releaseDate || 0))
                .map(version => ({
                    name: version.name,
                    version_number: version.name,
                    releaseDate: version.releaseDate * 1000, // Convert seconds to ms
                    date_published: new Date(version.releaseDate * 1000).toISOString(),
                    downloads: version.downloads || 0,
                    rating: version.rating?.average || 0,
                    loaders: [], // Spigot doesn't provide loader info in versions
                    game_versions: [] // Spigot doesn't provide game versions in versions
                }));
        } catch {
            // If versions fetch fails, continue with empty versions array
            versions = [];
        }

        const apiTime = performance.now() - apiStart;

        // Get stats from resource
        const stats = {
            downloads: resource?.downloads || 0,
            likes: resource?.likes || 0,
            rating: resource?.rating?.average || 0,
            ratingCount: resource?.rating?.count || 0,
            versionCount: totalVersionCount
        };

        return {
            project: resource, // Use 'project' key for consistency with unified system
            versions,
            stats,
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get stats for a Spigot author (for card generation)
     * @param {number} authorId - The author ID
     * @param {number} maxResources - Maximum resources to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getAuthorStats(authorId, maxResources = DEFAULT_RESOURCES_COUNT, convertToPng = false)
    {
        // Validate authorId is a number
        if (!/^\d+$/.test(String(authorId))) {
            return null;
        }

        const apiStart = performance.now();

        const authorResponse = await this.getAuthor(authorId);
        if (!authorResponse) {
            return null;
        }
        const author = authorResponse;

        let imageConversionTime = 0;

        // Fetch author avatar - Spiget API has separate avatar endpoint
        const avatarUrl = `${SPIGOT_API_URL}/v2/authors/${authorId}/avatar`;
        const avatarResult = await fetchImageAsBase64(avatarUrl, convertToPng);
        author.avatar_url_base64 = avatarResult?.data;
        if (avatarResult?.conversionTime) imageConversionTime += avatarResult.conversionTime;

        // Fetch author's resources
        let resources = [];
        let totalDownloads = 0;
        let allVersionDates = [];

        try {
            const resourcesResponse = await this.getAuthorResources(authorId, 50); // Fetch more for sorting
            const allResources = resourcesResponse || [];

            // Sort by downloads and take maxResources
            resources = allResources
                .sort((a, b) => (b?.downloads || 0) - (a?.downloads || 0))
                .slice(0, maxResources)
                .map(r => ({
                    id: r.id,
                    slug: r.id, // Spigot uses IDs, not slugs
                    name: r.name,
                    title: r.name,
                    description: r.tag || r.description || "",
                    downloads: r?.downloads || 0,
                    likes: r?.likes || 0,
                    rating: r?.rating?.average || 0,
                    date_created: r?.releaseDate ? new Date(r.releaseDate).toISOString() : null,
                    createdAt: r?.releaseDate ? new Date(r.releaseDate).toISOString() : null,
                    lastUpdated: r?.updateDate ? new Date(r.updateDate).toISOString() : null,
                    // Construct icon URL manually - Spiget API has separate icon endpoint per resource
                    icon_url: `${SPIGOT_API_URL}/v2/resources/${r.id}/icon`,
                    project_type: "plugin", // Spigot primarily has plugins
                    category: r?.category
                }));

            // Calculate total downloads across all author's resources
            totalDownloads = allResources.reduce((sum, r) => sum + (r?.downloads || 0), 0);

            // Fetch images for resources
            const projectsConversionTime = await this.fetchImagesForResources(resources, convertToPng);
            imageConversionTime += projectsConversionTime;

            // We don't fetch version dates for Spigot authors as it would require many API calls
            // Each resource would need its own versions endpoint call
            allVersionDates = [];
        } catch {
            // If resources fetch fails, continue with empty resources array
            resources = [];
        }

        const apiTime = performance.now() - apiStart;

        const stats = {
            totalDownloads,
            totalFollowers: 0, // Spigot doesn't have author followers
            resourceCount: resources.length,
            avgRating: this.calculateAvgRating(resources),
            allVersionDates
        };

        return {
            user: author, // Use 'user' key for consistency with unified system
            projects: resources, // Use 'projects' key for consistency
            stats,
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a Spigot resource (lightweight, no versions)
     * @param {number} resourceId - The resource ID
     * @param {boolean} fetchVersions - Whether to fetch versions for version count
     */
    async getResourceBadgeStats(resourceId, fetchVersions = false)
    {
        // Validate resourceId is a number
        if (!/^\d+$/.test(String(resourceId))) {
            return null;
        }

        const apiStart = performance.now();

        const resourceResponse = await this.getResource(resourceId);
        if (!resourceResponse) {
            return null;
        }
        const resource = resourceResponse;

        let apiTime = performance.now() - apiStart;

        const stats = {
            downloads: resource?.downloads || 0,
            likes: resource?.likes || 0,
            rating: resource?.rating?.average || 0,
            ratingCount: resource?.rating?.count || 0,
            versionCount: 0
        };

        // Only fetch versions if specifically requested (for version count badge)
        if (fetchVersions) {
            try {
                const versionsResponse = await this.getResourceVersions(resourceId);
                stats.versionCount = versionsResponse?.length || 0;
            } catch {
                stats.versionCount = 0;
            }
            apiTime = performance.now() - apiStart;
        }

        return { stats, timings: { api: apiTime } };
    }

    /**
     * Get badge stats for a Spigot author (lightweight, no resource details)
     * @param {number} authorId - The author ID
     */
    async getAuthorBadgeStats(authorId)
    {
        // Validate authorId is a number
        if (!/^\d+$/.test(String(authorId))) {
            return null;
        }

        const apiStart = performance.now();

        const authorResponse = await this.getAuthor(authorId);
        if (!authorResponse) {
            return null;
        }

        let totalDownloads = 0;
        let resourceCount = 0;
        let totalRating = 0;
        let ratingCount = 0;

        // Fetch all author's resources for stats
        try {
            const resourcesResponse = await this.getAuthorResources(authorId, 100);
            const allResources = resourcesResponse || [];
            totalDownloads = allResources.reduce((sum, r) => sum + (r?.downloads || 0), 0);
            resourceCount = allResources.length;

            // Calculate average rating across all resources
            for (const r of allResources) {
                if (r?.rating?.average) {
                    totalRating += r.rating.average;
                    ratingCount++;
                }
            }
        } catch {
            // Use basic author data if fetch fails
        }

        const apiTime = performance.now() - apiStart;

        const stats = {
            totalDownloads,
            totalFollowers: 0,
            resourceCount,
            avgRating: ratingCount > 0 ? totalRating / ratingCount : 0
        };

        return { stats, timings: { api: apiTime } };
    }

    /**
     * Helper method to fetch images for Spigot resources
     */
    async fetchImagesForResources(resources, convertToPng)
    {
        let totalConversionTime = 0;

        // Process images for each resource
        for (const resource of resources) {
            if (resource.icon_url) {
                const result = await fetchImageAsBase64(resource.icon_url, convertToPng);
                resource.icon_url_base64 = result?.data;
                if (result?.conversionTime) totalConversionTime += result.conversionTime;
            }
        }

        return totalConversionTime;
    }

    /**
     * Calculate average rating from resources
     */
    calculateAvgRating(resources)
    {
        const resourcesWithRating = resources.filter(r => r.rating && r.rating > 0);
        if (resourcesWithRating.length === 0) return 0;

        const sum = resourcesWithRating.reduce((acc, r) => acc + r.rating, 0);
        return (sum / resourcesWithRating.length).toFixed(1);
    }

    /**
     * Check if API is accessible (no API key required for Spigot)
     */
    isConfigured()
    {
        return true; // Spigot doesn't require an API key
    }
}

export default new SpigotClient();
