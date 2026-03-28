export function aggregateProjectStats(projects, topCount = 5)
{
    const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0);
    const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0);
    const projectCount = projects.length;

    const mostPopular = projects.reduce((max, project) =>
        (project.downloads || 0) > (max.downloads || 0) ? project : max
    , projects[0] || null);

    const topProjects = [...projects]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, topCount);

    const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
    const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

    return {
        totalDownloads,
        totalFollowers,
        projectCount,
        mostPopular,
        topProjects,
        avgDownloads,
        engagementRatio
    };
}

export function aggregateProjectTypes(projects)
{
    return projects.reduce((acc, project) =>
    {
        const types = Array.isArray(project.project_types)
            ? project.project_types
            : [project.project_type || "mod"];

        types.forEach(type =>
        {
            acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
    }, {});
}

export function aggregateGameVersions(projects, limit = 3)
{
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

    return Object.entries(gameVersions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([version]) => version);
}

export function aggregateLoaders(projects)
{
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
    return loaders;
}

export function aggregateCategories(projects, limit = 3)
{
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

    return Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([category]) => category);
}

export function findRecentProject(projects)
{
    return projects
        .filter(p => p.published)
        .sort((a, b) => new Date(b.published) - new Date(a.published))[0];
}

export function normalizeV3ProjectFields(projects)
{
    return projects.map(project => ({
        ...project,
        title: project.name || project.title,
        project_type: Array.isArray(project.project_types)
            ? project.project_types[0]
            : (project.project_type || "mod")
    }));
}

// Combined aggregation - does all aggregations in a single pass for performance
export function aggregateAllStats(projects, topCount = 5)
{
    const projectTypes = {};
    const gameVersions = {};
    const loaders = {};
    const categories = {};
    let totalDownloads = 0;
    let totalFollowers = 0;
    let mostPopular = projects[0] || null;
    let recentProject = null;

    // Single pass through all projects
    projects.forEach(project =>
    {
        // Download and follower totals
        totalDownloads += project.downloads || 0;
        totalFollowers += project.followers || 0;

        // Most popular project
        if ((project.downloads || 0) > (mostPopular?.downloads || 0))
        {
            mostPopular = project;
        }

        // Recent project
        if (project.published)
        {
            if (!recentProject || new Date(project.published) > new Date(recentProject.published))
            {
                recentProject = project;
            }
        }

        // Project types
        const types = Array.isArray(project.project_types)
            ? project.project_types
            : [project.project_type || "mod"];
        types.forEach(type => {
            projectTypes[type] = (projectTypes[type] || 0) + 1;
        });

        // Game versions
        if (project.game_versions && Array.isArray(project.game_versions))
        {
            project.game_versions.forEach(version => {
                gameVersions[version] = (gameVersions[version] || 0) + 1;
            });
        }

        // Loaders
        if (project.loaders && Array.isArray(project.loaders))
        {
            project.loaders.forEach(loader => {
                loaders[loader] = (loaders[loader] || 0) + 1;
            });
        }

        // Categories
        if (project.categories && Array.isArray(project.categories))
        {
            project.categories.forEach(category => {
                categories[category] = (categories[category] || 0) + 1;
            });
        }
    });

    // Sort and get top projects
    const topProjects = [...projects]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, topCount);

    // Get top game versions and categories
    const topGameVersions = Object.entries(gameVersions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([version]) => version);

    const topCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

    const projectCount = projects.length;
    const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0;
    const engagementRatio = totalDownloads > 0 ? (totalFollowers / totalDownloads * 1000).toFixed(1) : 0;

    return {
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
        recentProject
    };
}
