import dotenv from "dotenv";
import logger from "../utils/logger.js";
import { fetchImageAsBase64, fetchImagesForProjects, fetchVersionDatesForProjects } from "../utils/imageFetcher.js";
import { aggregateAllStats, normalizeV3ProjectFields, aggregateProjectStats } from "../utils/statsAggregator.js";

dotenv.config({ quiet: true });

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

const MODRINTH_API_URL = process.env.MODRINTH_API_URL;
const MODRINTH_API_V3_URL = process.env.MODRINTH_API_V3_URL;
const USER_AGENT = process.env.USER_AGENT;

// Default number of top projects to display
const DEFAULT_TOP_PROJECTS_COUNT = 5;

export class ModrinthClient
{
    async fetch(url)
    {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT.replace("{version}", VERSION) }
        });

        if (!response.ok)
        {
            if (response.status === 404)
            {
                throw new Error("Resource not found");
            }

            const errorBody = await response.text().catch(() => "");
            let errorText = errorBody;

            try
            {
                const json = JSON.parse(errorBody);
                errorText = json.error || json.message || json.description || errorBody;
            } catch { }

            throw new Error(`Modrinth API error: ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    async getUser(username)
    {
        return this.fetch(`${MODRINTH_API_URL}/user/${username}`);
    }

    async getUserProjects(username)
    {
        return this.fetch(`${MODRINTH_API_URL}/user/${username}/projects`);
    }

    async getProject(slug)
    {
        return this.fetch(`${MODRINTH_API_URL}/project/${slug}`);
    }

    async getProjectVersions(slug)
    {
        return this.fetch(`${MODRINTH_API_URL}/project/${slug}/version?include_changelog=false`);
    }

    async getOrganization(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/organization/${id}`);
    }

    async getOrganizationProjects(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/organization/${id}/projects`);
    }

    async getCollection(id)
    {
        return this.fetch(`${MODRINTH_API_V3_URL}/collection/${id}`);
    }

    async getProjects(ids)
    {
        const idsParam = JSON.stringify(ids);
        return this.fetch(`${MODRINTH_API_URL}/projects?ids=${encodeURIComponent(idsParam)}`);
    }

    async getUserStats(username, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        // Use combined aggregation for single-pass efficiency
        const stats = aggregateAllStats(projects, maxProjects);
        const topProjects = stats.topProjects;

        // Always fetch images, but only convert to PNG if rendering to PNG
        await Promise.all([
            fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this)),
            fetchImagesForProjects(topProjects, convertToPng),
            user.avatar_url ? fetchImageAsBase64(user.avatar_url, convertToPng).then(base64 => {
                user.avatar_url_base64 = base64;
            }) : Promise.resolve()
        ]);

        const allVersionDates = topProjects.flatMap(p => p.versionDates || []);

        return {
            user,
            projects,
            stats: {
                ...stats,
                allVersionDates
            }
        };
    }

    async getProjectStats(slug, maxVersions = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const [project, versions] = await Promise.all([
            this.getProject(slug),
            this.getProjectVersions(slug)
        ]);

        // Always fetch images, but only convert to PNG if rendering to PNG
        if (project.icon_url) {
            project.icon_url_base64 = await fetchImageAsBase64(project.icon_url, convertToPng);
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
            }
        };
    }

    async getOrganizationStats(id, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const [organization, rawProjects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        const projects = normalizeV3ProjectFields(rawProjects);

        // Use combined aggregation for single-pass efficiency
        const stats = aggregateAllStats(projects, maxProjects);
        const topProjects = stats.topProjects;

        // Always fetch images, but only convert to PNG if rendering to PNG
        await Promise.all([
            fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this)),
            fetchImagesForProjects(topProjects, convertToPng),
            organization.icon_url ? fetchImageAsBase64(organization.icon_url, convertToPng).then(base64 => {
                organization.icon_url_base64 = base64;
            }) : Promise.resolve()
        ]);

        const allVersionDates = topProjects.flatMap(p => p.versionDates || []);

        return {
            organization,
            projects,
            stats: {
                ...stats,
                allVersionDates
            }
        };
    }

    async getCollectionStats(id, maxProjects = DEFAULT_TOP_PROJECTS_COUNT, convertToPng = false)
    {
        const collection = await this.getCollection(id);

        const projects = collection.projects && collection.projects.length > 0
            ? await this.getProjects(collection.projects)
            : [];

        // Use optimized aggregation - only basic stats needed for collections
        const { totalDownloads, totalFollowers, projectCount, topProjects } = aggregateProjectStats(projects, maxProjects);

        // Always fetch images, but only convert to PNG if rendering to PNG
        await Promise.all([
            fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this)),
            fetchImagesForProjects(topProjects, convertToPng),
            collection.icon_url ? fetchImageAsBase64(collection.icon_url, convertToPng).then(base64 => {
                collection.icon_url_base64 = base64;
            }) : Promise.resolve()
        ]);

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
            }
        };
    }

    // Lightweight badge data fetchers - only fetch minimal stats
    async getUserBadgeStats(username)
    {
        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        const stats = {
            totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
            totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
            projectCount: projects.length
        };

        return { stats };
    }

    async getProjectBadgeStats(slug, fetchVersions = false)
    {
        const project = await this.getProject(slug);

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
        }

        return { stats };
    }

    async getOrganizationBadgeStats(id)
    {
        const [organization, rawProjects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        const projects = normalizeV3ProjectFields(rawProjects);

        const stats = {
            totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
            totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
            projectCount: projects.length
        };

        return { stats };
    }

    async getCollectionBadgeStats(id)
    {
        const collection = await this.getCollection(id);

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

        return { stats };
    }
}

export default new ModrinthClient();
