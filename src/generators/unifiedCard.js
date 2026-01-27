import { formatNumber } from "../utils/formatters.js";
import { getProjectTypeIcon } from "../constants/loaderConfig.js";
import { getPlatformConfig, getStatConfigs, getEntityIcon } from "../constants/platformConfig.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateProfileImage,
    generateRectImage,
    generateStatsGrid,
    generateDivider,
    generateVersionList,
    generateProjectList,
    generateAttribution,
    generateInfo
} from "./svgComponents.js";

const DEFAULT_VERSIONS_COUNT = 5;
const DEFAULT_PROJECTS_COUNT = 5;

/**
 * Generate a project card using the unified system
 * Supports projects from Modrinth, CurseForge, and Hangar
 */
function generateProjectCard(data, options, platformConfig, entityType = "project")
{
    const { project, versions, stats } = data;
    const {
        showVersions = true,
        maxVersions = DEFAULT_VERSIONS_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor; // Ensure platform color is used

    // Normalize version data - ensure all versions have expected field names
    const latestVersions = showVersions ? versions.slice(0, maxVersions).map(v => ({
        ...v,
        version_number: v.version_number || v.name || v.version || "Unknown",
        date_published: v.date_published || v.releasedAt || v.createdAt || v.fileDate || new Date().toISOString(),
        // Map Hangar platforms to loaders, and gameVersions to game_versions
        loaders: v.loaders || v.platforms || [],
        game_versions: v.game_versions || v.gameVersions || []
    })) : [];
    const hasVersions = showVersions && latestVersions.length > 0;
    const height = hasVersions ? 150 + (latestVersions.length * 50) : 130;

    const versionDates = versions.map(v => v[platformConfig.terminology.versionField]);

    // Get stat configs from platform config
    const statConfigs = getStatConfigs(platformConfig.id, entityType);
    const statsData = statConfigs ? statConfigs.map((config, index) => {
        const xPositions = [15, 155, 270];
        const value = stats[config.field];
        // Handle rank which may be null
        const displayValue = value == null ? "N/A" : formatNumber(value);
        return { x: xPositions[index], label: config.label, value: displayValue };
    }) : [];

    // Get project type icon - for CurseForge, we need special handling
    let projectTypeIconName = getEntityIcon(entityType);
    if (platformConfig.id === "modrinth" && project.project_type) {
        projectTypeIconName = getProjectTypeIcon(project.project_type);
    } else if (platformConfig.id === "curseforge" && project.classId) {
        // CurseForge class ID to icon mapping
        const classIconMap = {
            5: "plug", // Plugins
            6: "box", // Mods
            12: "paintbrush", // Resource Packs
            17: "earth", // Worlds
            4471: "package-open", // Modpacks
            4546: "glasses", // Shaders
            6552: "glasses", // Iris Shaders
            6768: "glasses", // Shaders
            6945: "datapack", // Datapacks
            84203: "optifine", // OptiFine
            84200: "canvas", // Canvas
        };
        projectTypeIconName = classIconMap[project.classId] || "box";
    }

    // Get title field name per platform
    const title = project.title || project.name || "Unknown";

    const content = `
${showSparklines ? generateActivitySparkline(versionDates, colors) : ""}
${generateHeader(entityType, projectTypeIconName, title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateRectImage(
        project.icon_url_base64 || null,
        "project-image-clip",
        365,
        25,
        70,
        70,
        14,
        colors
    )}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateVersionList(latestVersions, colors, relativeTime, platformConfig.labels.sections.latestVersions)}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}

/**
 * Generate a user card using the unified system
 * Supports users from Modrinth and Hangar
 */
function generateUserCard(data, options, platformConfig)
{
    const { user, projects, stats } = data;
    const {
        showProjects = true,
        maxProjects = DEFAULT_PROJECTS_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor;

    const topProjects = showProjects ? projects.slice(0, maxProjects) : [];
    const hasProjects = showProjects && topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 130;

    // Map projects to standard format for display
    const mappedProjects = topProjects.map(project => ({
        title: project.title || project.name,
        slug: project.slug,
        description: project.description,
        downloads: project.downloads,
        followers: project.followers || project.stars || 0,
        date: project.date_created || project.createdAt,
        icon_url_base64: project.icon_url_base64 || project.icon || null,
        project_type: project.project_type || "mod",
        loaders: project.loaders || [],
        game_versions: project.game_versions || [],
        categories: project.categories || [],
        versionDates: project.versionDates || []
    }));

    // Get all version dates for sparkline
    const allVersionDates = stats.allVersionDates || [];

    // Get stat configs from platform config
    const statConfigs = getStatConfigs(platformConfig.id, "user");
    const statsData = statConfigs ? statConfigs.map((config, index) => {
        const xPositions = [15, 155, 270];
        const value = stats[config.field];
        const displayValue = value == null ? "N/A" : formatNumber(value);
        return { x: xPositions[index], label: config.label, value: displayValue };
    }) : [];

    const title = user.name || user.username || "Unknown User";

    const content = `
${showSparklines ? generateActivitySparkline(allVersionDates, colors) : ""}
${generateHeader("user", "user", title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateProfileImage(user.avatar_url_base64 || user.avatarUrl || null, "profile-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateProjectList(mappedProjects, platformConfig.labels.sections.topProjects, colors, showSparklines, relativeTime)}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}

/**
 * Generate an organization card using the unified system
 * Supports organizations from Modrinth
 */
function generateOrganizationCard(data, options, platformConfig)
{
    const { organization, projects, stats } = data;
    const {
        showProjects = true,
        maxProjects = DEFAULT_PROJECTS_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor;

    const topProjects = showProjects ? projects.slice(0, maxProjects) : [];
    const hasProjects = showProjects && topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 130;

    // Map projects to standard format for display
    const mappedProjects = topProjects.map(project => ({
        title: project.title || project.name,
        slug: project.slug,
        description: project.description,
        downloads: project.downloads,
        followers: project.followers || 0,
        date: project.date_created || project.createdAt,
        icon_url_base64: project.icon_url_base64 || project.icon || null,
        project_type: project.project_type || "mod",
        loaders: project.loaders || [],
        game_versions: project.game_versions || [],
        categories: project.categories || [],
        versionDates: project.versionDates || []
    }));

    // Get all version dates for sparkline
    const allVersionDates = stats.allVersionDates || [];

    // Get stat configs from platform config
    const statConfigs = getStatConfigs(platformConfig.id, "organization");
    const statsData = statConfigs ? statConfigs.map((config, index) => {
        const xPositions = [15, 155, 270];
        const value = stats[config.field];
        const displayValue = value == null ? "N/A" : formatNumber(value);
        return { x: xPositions[index], label: config.label, value: displayValue };
    }) : [];

    const title = organization.name || organization.title || "Unknown Organization";

    const content = `
${showSparklines ? generateActivitySparkline(allVersionDates, colors) : ""}
${generateHeader("organization", "building", title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateProfileImage(organization.icon_url_base64 || organization.avatarUrl || null, "profile-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateProjectList(mappedProjects, platformConfig.labels.sections.topProjects, colors, showSparklines, relativeTime)}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}

/**
 * Generate a collection card using the unified system
 * Supports collections from Modrinth
 */
function generateCollectionCard(data, options, platformConfig)
{
    const { collection, projects, stats } = data;
    const {
        showProjects = true,
        maxProjects = DEFAULT_PROJECTS_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor;

    // Use stats.topProjects since that's where icons were fetched
    const topProjects = showProjects ? (stats.topProjects || []).slice(0, maxProjects) : [];
    const hasProjects = showProjects && topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 130;

    // Map projects to standard format for display
    const mappedProjects = topProjects.map(project => ({
        title: project.title || project.name,
        slug: project.slug,
        description: project.description,
        downloads: project.downloads,
        followers: project.followers || 0,
        date: project.date_created || project.createdAt,
        icon_url_base64: project.icon_url_base64 || project.icon || null,
        project_type: project.project_type || "mod",
        loaders: project.loaders || [],
        game_versions: project.game_versions || [],
        categories: project.categories || [],
        versionDates: project.versionDates || []
    }));

    // Get all version dates for sparkline
    const allVersionDates = stats.allVersionDates || [];

    // Get stat configs from platform config
    const statConfigs = getStatConfigs(platformConfig.id, "collection");
    const statsData = statConfigs ? statConfigs.map((config, index) => {
        const xPositions = [15, 155, 270];
        const value = stats[config.field];
        const displayValue = value == null ? "N/A" : formatNumber(value);
        return { x: xPositions[index], label: config.label, value: displayValue };
    }) : [];

    const title = collection.name || collection.title || "Unknown Collection";

    const content = `
${showSparklines ? generateActivitySparkline(allVersionDates, colors) : ""}
${generateHeader("collection", "collection", title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateProfileImage(collection.icon_url_base64 || collection.icon || null, "profile-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateProjectList(mappedProjects, platformConfig.labels.sections.topProjects, colors, showSparklines, relativeTime)}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}

/**
 * Main unified card generation function
 * Routes to the appropriate card generator based on entity type
 *
 * @param {Object} data - The data object from the service
 * @param {string} platformId - Platform ID (modrinth, curseforge, hangar)
 * @param {string} entityType - Entity type (project, user, organization, collection, mod)
 * @param {Object} options - Generation options
 * @returns {string} SVG string
 */
export function generateUnifiedCard(data, platformId, entityType, options = {})
{
    const platformConfig = getPlatformConfig(platformId);

    if (!platformConfig) {
        throw new Error(`Unknown platform: ${platformId}`);
    }

    // Map platform-specific entity types to standard types
    let mappedEntityType = entityType;
    if (platformId === "curseforge" && entityType === "mod") {
        mappedEntityType = "project";
    } else if (platformId === "spigot") {
        if (entityType === "resource") {
            mappedEntityType = "project";
        } else if (entityType === "author") {
            mappedEntityType = "user";
        }
    }

    switch (mappedEntityType) {
    case "project":
        return generateProjectCard(data, options, platformConfig, entityType);
    case "user":
        return generateUserCard(data, options, platformConfig);
    case "organization":
        return generateOrganizationCard(data, options, platformConfig);
    case "collection":
        return generateCollectionCard(data, options, platformConfig);
    default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
}
