import dotenv from "dotenv";
import { fetchImageAsBase64, fetchImagesForProjects, fetchVersionDatesForProjects } from "../utils/imageFetcher.js";
import { aggregateAllStats, normalizeV3ProjectFields, aggregateProjectStats } from "../utils/statsAggregator.js";
import { performance } from "perf_hooks";
import { BasePlatformClient } from "./baseClient.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const MODRINTH_API_URL = process.env.MODRINTH_API_URL;
const MODRINTH_API_V3_URL = process.env.MODRINTH_API_V3_URL;
const USER_AGENT = process.env.USER_AGENT;

// Default number of top projects/versions to display
const DEFAULT_TOP_PROJECTS_COUNT = 10;

export class ModrinthClient extends BasePlatformClient
{
    constructor()
    {
        super("Modrinth", {
            baseUrl: MODRINTH_API_URL,
            userAgent: USER_AGENT ? USER_AGENT.replace("{version}", VERSION) : undefined
        });
        this.v3BaseUrl = MODRINTH_API_V3_URL;
    }

    async getUser(username)
    {
        return this.fetch(`/user/${username}`);
    }

    async getUserProjects(username)
    {
        return this.fetch(`/user/${username}/projects`);
    }

    async getProject(slug)
    {
        return this.fetch(`/project/${slug}`);
    }

    async getProjectVersions(slug)
    {
        return this.fetch(`/project/${slug}/version?include_changelog=false`);
    }

    async getOrganization(id)
    {
        return this.fetch(`${this.v3BaseUrl}/organization/${id}`);
    }

    async getOrganizationProjects(id)
    {
        return this.fetch(`${this.v3BaseUrl}/organization/${id}/projects`);
    }

    async getCollection(id)
    {
        return this.fetch(`${this.v3BaseUrl}/collection/${id}`);
    }

    async getProjects(ids)
    {
        const idsParam = JSON.stringify(ids);
        return this.fetch(`/projects?ids=${encodeURIComponent(idsParam)}`);
    }

    async getUserStats(username, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const apiStart = performance.now();

        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        // Return null if user not found
        if (!user) {
            return null;
        }

        const apiTime = performance.now() - apiStart;

        // Use combined aggregation for single-pass efficiency
        const stats = aggregateAllStats(projects, maxProjects);
        const topProjects = stats.topProjects;

        let imageConversionTime = 0;
        const avatarResult = user.avatar_url ? await fetchImageAsBase64(user.avatar_url, convertToPng) : null;
        user.avatar_url_base64 = avatarResult?.data;
        if (avatarResult?.conversionTime) imageConversionTime += avatarResult.conversionTime;

        const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng);
        imageConversionTime += projectsConversionTime;

        await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this));

        const allVersionDates = topProjects.flatMap(p => p.versionDates || []);

        return {
            user,
            projects,
            stats: {
                ...stats,
                allVersionDates
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    async getProjectStats(slug, maxVersions = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const apiStart = performance.now();

        const [project, versions] = await Promise.all([
            this.getProject(slug),
            this.getProjectVersions(slug)
        ]);

        // Return null if project not found
        if (!project) {
            return null;
        }

        const apiTime = performance.now() - apiStart;

        let imageConversionTime = 0;
        if (project.icon_url) {
            const result = await fetchImageAsBase64(project.icon_url, convertToPng);
            project.icon_url_base64 = result?.data;
            if (result?.conversionTime) imageConversionTime += result.conversionTime;
        }

        const latestVersions = [...versions]
            .sort((a, b) => new Date(b.date_published) - new Date(a.date_published))
            .slice(0, maxVersions);

        return {
            project,
            versions: latestVersions,
            stats: {
                downloads: project.downloads || 0,
                followers: project.followers || 0,
                versionCount: versions.length
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    async getOrganizationStats(id, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const apiStart = performance.now();

        const [organization, rawProjects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        // Return null if organization not found
        if (!organization) {
            return null;
        }

        const apiTime = performance.now() - apiStart;

        const projects = normalizeV3ProjectFields(rawProjects);

        // Use combined aggregation for single-pass efficiency
        const stats = aggregateAllStats(projects, maxProjects);
        const topProjects = stats.topProjects;

        let imageConversionTime = 0;
        const orgIconResult = organization.icon_url ? await fetchImageAsBase64(organization.icon_url, convertToPng) : null;
        organization.icon_url_base64 = orgIconResult?.data;
        if (orgIconResult?.conversionTime) imageConversionTime += orgIconResult.conversionTime;

        const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng);
        imageConversionTime += projectsConversionTime;

        await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this));

        const allVersionDates = topProjects.flatMap(p => p.versionDates || []);

        return {
            organization,
            projects,
            stats: {
                ...stats,
                allVersionDates
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    async getCollectionStats(id, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const apiStart = performance.now();

        const collection = await this.getCollection(id);

        // Return null if collection not found
        if (!collection) {
            return null;
        }

        const projects = collection.projects && collection.projects.length > 0
            ? await this.getProjects(collection.projects)
            : [];

        const apiTime = performance.now() - apiStart;

        // Use optimized aggregation - only basic stats needed for collections
        const { totalDownloads, totalFollowers, projectCount, topProjects } = aggregateProjectStats(projects, maxProjects);

        let imageConversionTime = 0;
        const collectionIconResult = collection.icon_url ? await fetchImageAsBase64(collection.icon_url, convertToPng) : null;
        collection.icon_url_base64 = collectionIconResult?.data;
        if (collectionIconResult?.conversionTime) imageConversionTime += collectionIconResult.conversionTime;

        const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng);
        imageConversionTime += projectsConversionTime;

        await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this));

        const allVersionDates = topProjects.flatMap(p => p.versionDates || []);

        return {
            collection,
            projects,
            stats: {
                totalDownloads,
                totalFollowers,
                projectCount,
                topProjects,
                allVersionDates
            },
            timings: {
                api: apiTime,
                imageConversion: imageConversionTime
            }
        };
    }

    // Lightweight badge data fetchers - only fetch minimal stats
    async getUserBadgeStats(username)
    {
        const apiStart = performance.now();

        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        // Return null if user not found
        if (!user) {
            return null;
        }

        const apiTime = performance.now() - apiStart;

        const stats = {
            totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
            totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
            projectCount: projects.length
        };

        return { stats, timings: { api: apiTime } };
    }

    async getProjectBadgeStats(slug, fetchVersions = false)
    {
        const apiStart = performance.now();

        const project = await this.getProject(slug);

        // Return null if project not found
        if (!project) {
            return null;
        }

        let apiTime = performance.now() - apiStart;

        const stats = {
            downloads: project.downloads || 0,
            followers: project.followers || 0,
            versionCount: 0
        };

        // Only fetch versions if specifically requested (for version count badge)
        if (fetchVersions) {
            try {
                const versions = await this.getProjectVersions(slug);
                stats.versionCount = versions.length;
            } catch {
                stats.versionCount = 0;
            }
            apiTime = performance.now() - apiStart;
        }

        return { stats, timings: { api: apiTime } };
    }

    async getOrganizationBadgeStats(id)
    {
        const apiStart = performance.now();

        const [organization, rawProjects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        // Return null if organization not found
        if (!organization) {
            return null;
        }

        const apiTime = performance.now() - apiStart;

        const projects = normalizeV3ProjectFields(rawProjects);

        const stats = {
            totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
            totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
            projectCount: projects.length
        };

        return { stats, timings: { api: apiTime } };
    }

    async getCollectionBadgeStats(id)
    {
        const apiStart = performance.now();

        const collection = await this.getCollection(id);

        // Return null if collection not found
        if (!collection) {
            return null;
        }

        let stats = {
            totalDownloads: 0,
            totalFollowers: 0,
            projectCount: 0
        };

        if (collection.projects && collection.projects.length > 0) {
            const projects = await this.getProjects(collection.projects);
            stats = {
                totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
                totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
                projectCount: projects.length
            };
        }

        const apiTime = performance.now() - apiStart;

        return { stats, timings: { api: apiTime } };
    }
}

export default new ModrinthClient();
