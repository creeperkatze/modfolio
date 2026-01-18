import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config({ quiet: true });

const MODRINTH_API_URL = process.env.MODRINTH_API_URL;
const MODRINTH_API_V3_URL = process.env.MODRINTH_API_V3_URL;
const USER_AGENT = process.env.USER_AGENT;

export class ModrinthClient
{
    async fetch(url)
    {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });

        if (!response.ok)
        {
            if (response.status === 404)
            {
                throw new Error("Resource not found");
            }

            // Get error details from response
            const errorBody = await response.text().catch(() => "");
            let errorText = errorBody;

            // Try parsing as JSON for structured error messages
            try
            {
                const json = JSON.parse(errorBody);
                errorText = json.error || json.message || json.description || errorBody;
            } catch { }

            logger.warn(`API error ${response.status}: ${url}`);
            throw new Error(`Modrinth API error: ${response.status}|${errorText}`);
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

    async fetchImageAsBase64(url)
    {
        if (!url) return null;
        try
        {
            const response = await fetch(url, {
                headers: {
                    "User-Agent": USER_AGENT
                }
            });
            if (!response.ok) return null;

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString("base64");
            const contentType = response.headers.get("content-type") || "image/png";
            return `data:${contentType};base64,${base64}`;
        } catch (error)
        {
            logger.warn(`Failed to fetch image ${url}: ${error.message}`);
            return null;
        }
    }

    async getUserStats(username)
    {
        const [user, projects] = await Promise.all([
            this.getUser(username),
            this.getUserProjects(username)
        ]);

        // Fetch all versions for all projects to get version dates
        const allVersions = [];
        await Promise.all(
            projects.map(async (project) =>
            {
                try {
                    const versions = await this.getProjectVersions(project.id || project.slug);
                    const versionDates = versions.map(v => v.date_published);
                    allVersions.push(...versionDates);
                    // Store version dates on the project itself for individual sparklines
                    project.versionDates = versionDates;
                } catch (error) {
                    // Silently ignore version fetch errors for individual projects
                    project.versionDates = [];
                }
            })
        );

        // Fetch user avatar as base64
        if (user.avatar_url)
        {
            user.avatar_url_base64 = await this.fetchImageAsBase64(user.avatar_url);
        }

        // Fetch project icons as base64
        await Promise.all(
            projects.map(async (project) =>
            {
                if (project.icon_url)
                {
                    project.icon_url_base64 = await this.fetchImageAsBase64(project.icon_url);
                }
            })
        );

        // Calculate aggregate statistics
        const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
        const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
        const projectCount = projects.length;

        // Find most popular project
        const mostPopular = projects.reduce((max, project) =>
            (project.downloads || 0) > (max.downloads || 0) ? project : max
        , projects[0] || null);

        // Sort projects by downloads for top projects
        const topProjects = [...projects]
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 5);

        // Calculate new metrics
        const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
        const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

        // Project type breakdown
        const projectTypes = projects.reduce((acc, project) =>
        {
            const type = project.project_type || "unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // Game versions (get most common versions)
        const gameVersions = {};
        projects.forEach(project =>
        {
            if (project.game_versions && Array.isArray(project.game_versions))
            {
                project.game_versions.forEach(version =>
                {
                    gameVersions[version] = (gameVersions[version] || 0) + 1;
                });
            }
        });
        const topGameVersions = Object.entries(gameVersions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([version]) => version);

        // Loaders breakdown
        const loaders = {};
        projects.forEach(project =>
        {
            if (project.loaders && Array.isArray(project.loaders))
            {
                project.loaders.forEach(loader =>
                {
                    loaders[loader] = (loaders[loader] || 0) + 1;
                });
            }
        });

        // Categories (most common)
        const categories = {};
        projects.forEach(project =>
        {
            if (project.categories && Array.isArray(project.categories))
            {
                project.categories.forEach(category =>
                {
                    categories[category] = (categories[category] || 0) + 1;
                });
            }
        });
        const topCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);

        // Recent activity
        const recentProject = projects
            .filter(p => p.published)
            .sort((a, b) => new Date(b.published) - new Date(a.published))[0];

        return {
            user,
            projects,
            stats: {
                totalDownloads,
                totalFollowers,
                projectCount,
                mostPopular,
                topProjects,
                avgDownloads,
                engagementRatio,
                projectTypes,
                topGameVersions,
                loaders,
                topCategories,
                recentProject,
                allVersionDates: allVersions
            }
        };
    }

    async getProjectStats(slug)
    {
        const [project, versions] = await Promise.all([
            this.getProject(slug),
            this.getProjectVersions(slug)
        ]);

        // Fetch project icon as base64
        if (project.icon_url)
        {
            project.icon_url_base64 = await this.fetchImageAsBase64(project.icon_url);
        }

        // Sort versions by date (newest first) and take top 5
        const latestVersions = [...versions]
            .sort((a, b) => new Date(b.date_published) - new Date(a.date_published))
            .slice(0, 5);

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

    async getOrganizationStats(id)
    {
        const [organization, projects] = await Promise.all([
            this.getOrganization(id),
            this.getOrganizationProjects(id)
        ]);

        // Fetch all versions for all projects to get version dates
        const allVersions = [];
        await Promise.all(
            projects.map(async (project) =>
            {
                try {
                    const versions = await this.getProjectVersions(project.id || project.slug);
                    const versionDates = versions.map(v => v.date_published);
                    allVersions.push(...versionDates);
                    // Store version dates on the project itself for individual sparklines
                    project.versionDates = versionDates;
                } catch (error) {
                    // Silently ignore version fetch errors for individual projects
                    project.versionDates = [];
                }
            })
        );

        // Fetch organization icon as base64
        if (organization.icon_url)
        {
            organization.icon_url_base64 = await this.fetchImageAsBase64(organization.icon_url);
        }

        // Fetch project icons as base64
        await Promise.all(
            projects.map(async (project) =>
            {
                if (project.icon_url)
                {
                    project.icon_url_base64 = await this.fetchImageAsBase64(project.icon_url);
                }
            })
        );

        // Calculate aggregate statistics
        const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
        const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
        const projectCount = projects.length;

        // Find most popular project
        const mostPopular = projects.reduce((max, project) =>
            (project.downloads || 0) > (max.downloads || 0) ? project : max
        , projects[0] || null);

        // Sort projects by downloads for top projects
        // Map v3 API fields to match what the card generator expects
        const topProjects = [...projects]
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 5)
            .map(project => ({
                ...project,
                title: project.name, // v3 uses 'name', cards expect 'title'
                project_type: project.project_types?.[0] || "mod" // v3 uses array, cards expect string
            }));

        // Calculate new metrics
        const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
        const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

        // Project type breakdown
        const projectTypes = projects.reduce((acc, project) =>
        {
            const types = project.project_types || ["mod"];
            types.forEach(type =>
            {
                acc[type] = (acc[type] || 0) + 1;
            });
            return acc;
        }, {});

        // Game versions (get most common versions)
        const gameVersions = {};
        projects.forEach(project =>
        {
            if (project.game_versions && Array.isArray(project.game_versions))
            {
                project.game_versions.forEach(version =>
                {
                    gameVersions[version] = (gameVersions[version] || 0) + 1;
                });
            }
        });
        const topGameVersions = Object.entries(gameVersions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([version]) => version);

        // Loaders breakdown
        const loaders = {};
        projects.forEach(project =>
        {
            if (project.loaders && Array.isArray(project.loaders))
            {
                project.loaders.forEach(loader =>
                {
                    loaders[loader] = (loaders[loader] || 0) + 1;
                });
            }
        });

        // Categories (most common)
        const categories = {};
        projects.forEach(project =>
        {
            if (project.categories && Array.isArray(project.categories))
            {
                project.categories.forEach(category =>
                {
                    categories[category] = (categories[category] || 0) + 1;
                });
            }
        });
        const topCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);

        // Recent activity
        const recentProject = projects
            .filter(p => p.published)
            .sort((a, b) => new Date(b.published) - new Date(a.published))[0];

        return {
            organization,
            projects,
            stats: {
                totalDownloads,
                totalFollowers,
                projectCount,
                mostPopular,
                topProjects,
                avgDownloads,
                engagementRatio,
                projectTypes,
                topGameVersions,
                loaders,
                topCategories,
                recentProject,
                allVersionDates: allVersions
            }
        };
    }

    async getCollectionStats(id)
    {
        const collection = await this.getCollection(id);

        // Fetch all projects in the collection
        const projects = collection.projects && collection.projects.length > 0
            ? await this.getProjects(collection.projects)
            : [];

        // Fetch all versions for all projects to get version dates
        const allVersions = [];
        await Promise.all(
            projects.map(async (project) =>
            {
                try {
                    const versions = await this.getProjectVersions(project.id || project.slug);
                    const versionDates = versions.map(v => v.date_published);
                    allVersions.push(...versionDates);
                    // Store version dates on the project itself for individual sparklines
                    project.versionDates = versionDates;
                } catch (error) {
                    // Silently ignore version fetch errors for individual projects
                    project.versionDates = [];
                }
            })
        );

        // Fetch collection icon as base64
        if (collection.icon_url)
        {
            collection.icon_url_base64 = await this.fetchImageAsBase64(collection.icon_url);
        }

        // Fetch project icons as base64
        await Promise.all(
            projects.map(async (project) =>
            {
                if (project.icon_url)
                {
                    project.icon_url_base64 = await this.fetchImageAsBase64(project.icon_url);
                }
            })
        );

        // Calculate aggregate statistics
        const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
        const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
        const projectCount = projects.length;

        // Sort projects by downloads for top projects
        const topProjects = [...projects]
            .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
            .slice(0, 5);

        return {
            collection,
            projects,
            stats: {
                totalDownloads,
                totalFollowers,
                projectCount,
                topProjects,
                allVersionDates: allVersions
            }
        };
    }
}

export default new ModrinthClient();
