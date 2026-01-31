import dotenv from "dotenv";
import { performance } from "perf_hooks";
import { fetchImageAsBase64, fetchImagesForProjects, fetchVersionDatesForProjects } from "../utils/imageFetcher.js";
import { BasePlatformClient } from "./baseClient.js";
import logger from "../utils/logger.js";
import { CARD_LIMITS } from "../constants/platformConfig.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const HANGAR_API_URL = process.env.HANGAR_API_URL || "https://hangar.papermc.io";
const HANGAR_API_KEY = process.env.HANGAR_API_KEY;
const USER_AGENT = process.env.USER_AGENT;

/**
 * Hangar API client for fetching project data from Hangar (PaperMC's plugin platform)
 * API Documentation: https://hangar.papermc.io/api-docs
 */
export class HangarClient extends BasePlatformClient
{
    constructor()
    {
        super("Hangar", {
            baseUrl: HANGAR_API_URL,
            apiKey: HANGAR_API_KEY,
            userAgent: USER_AGENT ? USER_AGENT.replace("{version}", VERSION) : undefined
        });
    }

    getHeaders()
    {
        const headers = super.getHeaders();
        if (this.apiKey) {
            // Hangar uses Authorization header with Bearer token or API key
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }

    /**
     * Get project data by slug
     * @param {string} projectSlug - The project slug
     * @returns {Promise<Object>} Project data
     */
    async getProject(projectSlug)
    {
        // Hangar API endpoint for projects: /api/v1/projects/{slug}
        return this.fetch(`/api/v1/projects/${encodeURIComponent(projectSlug)}`);
    }

    /**
     * Get project versions
     * @param {string} projectSlug - The project slug
     * @param {number} limit - Maximum versions to fetch
     * @returns {Promise<Object>} Versions data
     */
    async getProjectVersions(projectSlug, limit = 10)
    {
        // Hangar API endpoint for versions: /api/v1/projects/{slug}/versions
        return this.fetch(`/api/v1/projects/${encodeURIComponent(projectSlug)}/versions?limit=${limit}`);
    }

    /**
     * Get stats for a Hangar project (for card generation)
     * @param {string} projectSlug - The project slug
     * @param {number} maxVersions - Maximum versions to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getProjectStats(projectSlug, convertToPng = false)
    {
        const apiStart = performance.now();

        const projectResponse = await this.getProject(projectSlug);
        if (!projectResponse) {
            return null; // Return null instead of throwing to avoid stack trace
        }
        const project = projectResponse;

        let imageConversionTime = 0;

        // Fetch project icon if available
        // Check multiple possible icon fields
        const iconUrl = project?.iconUrl || project?.icon || project?.avatarUrl;
        if (iconUrl) {
            const result = await fetchImageAsBase64(iconUrl, convertToPng);
            project.icon_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch versions for the project
        let versions = [];
        let totalVersionCount = 0;
        try {
            // Always fetch max for caching (card generator slices to maxVersions)
            const versionsResponse = await this.getProjectVersions(projectSlug, CARD_LIMITS.MAX_COUNT);
            const allVersions = versionsResponse?.result || [];
            totalVersionCount = versionsResponse?.pagination?.count ?? allVersions.length;

            // Sort by date (newest first)
            versions = allVersions
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(version => {
                    // Extract platform data from downloads keys (Paper, Velocity, Waterfall, etc.)
                    const platforms = Object.keys(version.downloads || {});

                    // Get version download count from stats.totalDownloads
                    const downloads = version?.stats?.totalDownloads || 0;

                    // Extract all unique Minecraft versions from platformDependencies
                    const gameVersions = new Set();
                    if (version.platformDependencies) {
                        Object.values(version.platformDependencies).forEach(versionList => {
                            versionList.forEach(v => gameVersions.add(v));
                        });
                    }

                    return {
                        name: version.name,
                        version: version.name,
                        createdAt: version.createdAt,
                        releasedAt: version.createdAt,
                        description: version.description,
                        downloads: downloads,
                        platforms: platforms,
                        gameVersions: Array.from(gameVersions),
                        channel: version.channel?.name || "Release",
                        externalUrl: version.externalUrl || null
                    };
                });
        } catch {
            // If versions fetch fails, continue with empty versions array
            versions = [];
        }

        const apiTime = performance.now() - apiStart;

        // Get stats from project
        const stats = {
            downloads: project?.stats?.downloads || project?.downloads || 0,
            stars: project?.stats?.stars || 0,
            versionCount: totalVersionCount
        };

        return {
            project,
            versions,
            stats,
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a Hangar project
     * @param {string} projectSlug - The project slug
     */
    async getProjectBadgeStats(projectSlug)
    {
        const apiStart = performance.now();

        const projectResponse = await this.getProject(projectSlug);
        const project = projectResponse;

        const stats = {
            downloads: project?.stats?.downloads || project?.downloads || 0,
            views: project?.stats?.views || project?.views || 0,
            versionCount: 0
        };

        // Fetch versions
        try {
            const versionsResponse = await this.getProjectVersions(projectSlug);
            stats.versionCount = versionsResponse?.pagination?.count ?? versionsResponse?.result?.length ?? 0;
        } catch {
            stats.versionCount = 0;
        }

        const apiTime = performance.now() - apiStart;
        return { stats, timings: { api: apiTime } };
    }

    /**
     * Get user data by username
     * @param {string} username - The username
     * @returns {Promise<Object>} User data
     */
    async getUser(username)
    {
        // Hangar API endpoint for users: /api/v1/users/{username}
        return this.fetch(`/api/v1/users/${encodeURIComponent(username)}`);
    }

    /**
     * Get user's projects
     * @param {string} username - The username
     * @param {number} limit - Maximum projects to fetch
     * @returns {Promise<Object>} Projects data
     */
    async getUserProjects(username, limit = 25)
    {
        // Hangar API endpoint for projects with owner filter: /api/v1/projects?owner={username}
        return this.fetch(`/api/v1/projects?owner=${encodeURIComponent(username)}&limit=${limit}`);
    }

    /**
     * Get stats for a Hangar user (for card generation)
     * @param {string} username - The username
     * @param {number} maxProjects - Maximum projects to fetch
     * @param {boolean} convertToPng - Whether to convert images to PNG
     */
    async getUserStats(username, convertToPng = false)
    {
        const apiStart = performance.now();

        const userResponse = await this.getUser(username);
        if (!userResponse) {
            return null; // Return null instead of throwing to avoid stack trace
        }
        const user = userResponse;

        let imageConversionTime = 0;

        // Fetch user avatar if available
        const avatarUrl = user?.avatarUrl;
        if (avatarUrl) {
            const result = await fetchImageAsBase64(avatarUrl, convertToPng);
            user.avatar_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        // Fetch user's projects
        let projects = [];
        let totalDownloads = 0;
        let allVersionDates = [];

        try {
            const projectsResponse = await this.getUserProjects(username, 50); // Fetch more for sorting
            const allProjects = projectsResponse?.result || [];

            // Sort by downloads and take max (for caching, card generator slices to maxProjects)
            projects = allProjects
                .sort((a, b) => (b?.stats?.downloads || 0) - (a?.stats?.downloads || 0))
                .slice(0, CARD_LIMITS.MAX_COUNT)
                .map(project => ({
                    slug: project.namespace?.slug,
                    id: project.namespace?.slug, // For fetchVersionDatesForProjects
                    name: project.name,
                    description: project.description,
                    downloads: project?.stats?.downloads || 0,
                    views: project?.stats?.views || 0,
                    stars: project?.stats?.stars || 0,
                    category: project.category,
                    createdAt: project.createdAt,
                    lastUpdated: project.lastUpdated,
                    // Normalize icon_url for fetchImagesForProjects utility
                    // Hangar API returns avatarUrl at root level
                    icon_url: project.avatarUrl || null
                }));

            // Calculate total downloads across all user's projects
            totalDownloads = allProjects.reduce((sum, p) => sum + (p?.stats?.downloads || 0), 0);

            // Use reusable utilities for image fetching and version dates
            const projectsConversionTime = await fetchImagesForProjects(projects, convertToPng);
            imageConversionTime += projectsConversionTime;

            // Custom version fetcher that transforms Hangar versions to match expected format
            const getVersionsForSparkline = async (slug) => {
                const versionsResponse = await this.getProjectVersions(slug, 10);
                const versions = versionsResponse?.result || [];
                // Transform Hangar versions to match Modrinth format (date_published)
                return versions.map(v => ({
                    date_published: v.createdAt
                }));
            };

            try {
                await fetchVersionDatesForProjects(projects, getVersionsForSparkline);
                allVersionDates = projects.flatMap(p => p.versionDates || []);
            } catch (err) {
                logger.warn(`Failed to fetch version dates for Hangar user "${username}": ${err.message}`);
                allVersionDates = [];
            }
        } catch {
            // If projects fetch fails, continue with empty projects array
            projects = [];
        }

        const apiTime = performance.now() - apiStart;

        const stats = {
            totalDownloads,
            totalFollowers: 0, // Hangar doesn't have user followers
            projectCount: user?.projectCount || projects.length,
            allVersionDates
        };

        return {
            user,
            projects,
            stats,
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    /**
     * Get badge stats for a Hangar user (lightweight, no project details)
     * @param {string} username - The username
     */
    async getUserBadgeStats(username)
    {
        const apiStart = performance.now();

        const userResponse = await this.getUser(username);
        const user = userResponse;

        let totalDownloads = 0;
        let projectCount = user?.projectCount || 0;

        // Fetch all user's projects for download count
        try {
            const projectsResponse = await this.getUserProjects(username, 100);
            const allProjects = projectsResponse?.result || [];
            totalDownloads = allProjects.reduce((sum, p) => sum + (p?.stats?.downloads || 0), 0);
            projectCount = projectsResponse?.pagination?.count ?? allProjects.length;
        } catch {
            // Use projectCount from user data if fetch fails
        }

        const apiTime = performance.now() - apiStart;

        const stats = {
            totalDownloads,
            totalFollowers: 0, // Hangar doesn't have user followers
            projectCount
        };

        return { stats, timings: { api: apiTime } };
    }

    /**
     * Check if API key is configured
     */
    isConfigured()
    {
        return !!HANGAR_API_KEY;
    }
}

export default new HangarClient();
