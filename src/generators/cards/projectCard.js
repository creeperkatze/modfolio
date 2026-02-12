import { formatNumber } from "../../utils/formatters.js";
import { getProjectTypeIcon } from "../../constants/loaderConfig.js";
import { getStatConfigs, getEntityIcon, CARD_LIMITS } from "../../constants/platformConfig.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateRectImage,
    generateStatsGrid,
    generateDivider,
    generateVersionList,
    generateInfo,
    generateAttribution,
    calculateBottomDelay
} from "../../utils/svgComponents.js";

export function generateProjectCard(data, options, platformConfig, entityType = "project")
{
    const { project, versions, stats } = data;
    const {
        showVersions = true,
        maxVersions = CARD_LIMITS.DEFAULT_COUNT,
        showSparklines = true,
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
    const xPositions = [15, 155, 270];
    const statsData = statConfigs ? statConfigs.filter(config => {
        if (config.field === "rank") {
            const value = stats[config.field];
            return value == null || value <= 10000;
        }
        return true;
    }).map((config, index) => {
        const value = stats[config.field];
        let displayValue;
        if (config.field === "rank" && value != null) {
            displayValue = `#${formatNumber(value)}`;
        } else if (config.field === "rank") {
            displayValue = "N/A";
        } else {
            displayValue = formatNumber(value);
        }
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

    const bottomDelay = calculateBottomDelay(latestVersions.length);

    const content = `
${showSparklines ? generateActivitySparkline(versionDates, colors, animations) : ""}
${generateHeader(entityType, projectTypeIconName, title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateRectImage(
        project.icon_url_base64 || null,
        "project-image-clip",
        365,
        25,
        70,
        70,
        14,
        colors,
        animations
    )}
${generateStatsGrid(statsData, colors, animations)}
${generateDivider(colors, animations)}
${generateVersionList(latestVersions, colors, relativeTime, platformConfig.labels.sections.latestVersions, animations)}
${generateInfo(height, colors, fromCache, animations, bottomDelay)}
${generateAttribution(height, colors, animations, bottomDelay)}
`;

    return generateSvgWrapper(450, height, colors, content, showBorder, animations);
}
