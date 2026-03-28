import { formatNumber } from "../../utils/formatters.js";
import { getStatConfigs, CARD_LIMITS } from "../../constants/platformConfig.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateProfileImage,
    generateStatsGrid,
    generateDivider,
    generateProjectList,
    generateInfo,
    generateAttribution,
    calculateBottomDelay
} from "../../utils/svgComponents.js";

export function generateUserCard(data, options, platformConfig)
{
    const { user, projects, stats } = data;
    const {
        showProjects = true,
        maxProjects = CARD_LIMITS.DEFAULT_COUNT,
        showSparklines = true,
        showDownloadBars = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false,
        showBorder = true,
        animations = true
    } = options;

    // Use platform default color if no custom color specified
    const accentColor = color || platformConfig.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);
    colors.accentColor = accentColor;

    // Use stats.topProjects for Modrinth (sorted by downloads), or fall back to projects (already sorted for Hangar)
    const projectsToUse = stats.topProjects || projects;
    const topProjects = showProjects ? projectsToUse.slice(0, maxProjects) : [];
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

    const bottomDelay = calculateBottomDelay(topProjects.length);

    const content = `
${showSparklines ? generateActivitySparkline(allVersionDates, colors, animations) : ""}
${generateHeader("user", "user", title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateProfileImage(user.avatar_url_base64 || user.avatarUrl || null, "profile-clip", 400, 60, 35, colors, animations)}
${generateStatsGrid(statsData, colors, animations)}
${generateDivider(colors, animations)}
${generateProjectList(mappedProjects, platformConfig.labels.sections.topProjects, colors, showSparklines, showDownloadBars, animations)}
${generateInfo(height, colors, fromCache, animations, bottomDelay)}
${generateAttribution(height, colors, animations, bottomDelay)}
`;

    return generateSvgWrapper(450, height, colors, content, showBorder, animations);
}
