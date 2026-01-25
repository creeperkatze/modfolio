import { formatNumber, escapeXml, truncateText } from "../utils/formatters.js";
import { ICONS } from "../constants/icons.js";
import { PLATFORMS } from "../constants/platforms.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateRectImage,
    generateStatsGrid,
    generateDivider,
    generateVersionList,
    generateAttribution,
    generateInfo
} from "./svgComponents.js";

const DEFAULT_FILE_COUNT = 5;

/**
 * Get project type icon from CurseForge class ID
 */
function getProjectTypeIconFromClassId(classId)
{
    // CurseForge class IDs (for Minecraft)
    // https://docs.curseforge.com/#toc_Schemas-ProjectClass
    const classIconMap = {
        5: "plug", // Plugins (Bukkit, Spigot, etc.)
        6: "box", // Mods
        12: "paintbrush", // Resource Packs
        17: "earth", // Worlds
        4471: "package-open", // Modpacks
        4546: "glasses", // Shaders category
        6552: "glasses", // Iris Shaders mod
        6768: "glasses", // Shaders (various shader mods)
        6945: "datapack", // Datapacks
        84203: "optifine", // OptiFine
        84200: "canvas", // Canvas Renderer
    };
    return classIconMap[classId] || "box";
}

/**
 * Generate a CurseForge mod card
 */
export function generateCurseforgeCard(data, options = {})
{
    const { mod, files, stats } = data;
    const {
        showVersions = true,
        maxVersions = DEFAULT_FILE_COUNT,
        showSparklines = true,
        color = null,
        backgroundColor = null,
        fromCache = false,
        relativeTime = false
    } = options;

    // Use CurseForge orange as default if no custom color specified
    const accentColor = color || PLATFORMS.CURSEFORGE.defaultColor;
    const colors = getThemeColors(accentColor, backgroundColor);

    // Override accent color to ensure CurseForge orange is used
    colors.accentColor = accentColor;

    // Map CurseForge files to Modrinth version format
    const versions = showVersions ? files.slice(0, maxVersions).map(file => ({
        version_number: file.displayName,
        date_published: file.fileDate,
        loaders: file.modLoaders || [],
        game_versions: file.gameVersions || [],
        downloads: file.downloadCount || 0
    })) : [];

    // Extract all file dates for sparkline (not just displayed versions)
    const allFileDates = files.map(file => file.fileDate);

    const hasVersions = showVersions && versions.length > 0;
    const height = hasVersions ? 150 + (versions.length * 50) : 130;

    // Get project type icon from class ID
    const projectTypeIconName = getProjectTypeIconFromClassId(mod.classId);
    const projectTypeIcon = ICONS[projectTypeIconName] || ICONS.box;

    const statsData = [
        { x: 15, label: "Downloads", value: formatNumber(stats.downloads) },
        { x: 155, label: "Rank", value: stats.rank ? stats.rank : "N/A" },
        { x: 270, label: "Files", value: stats.fileCount }
    ];

    const content = `
${showSparklines ? generateActivitySparkline(allFileDates, colors) : ""}
${generateRectImage(
        mod.logo_url_base64 || null,
        "mod-image-clip",
        365,
        25,
        70,
        70,
        14,
        colors
    )}

  <!-- CurseForge Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 32 32">
    ${PLATFORMS.CURSEFORGE.icon(colors.accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(colors.textColor)}
  </svg>

  <!-- Project Type Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${projectTypeIcon(colors.textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="Inter, sans-serif"
      font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${escapeXml(truncateText(mod.name || "Unknown Mod", 22))}
  </text>

${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateVersionList(versions, colors, relativeTime, "Latest Files")}
${generateInfo(height, colors, fromCache)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}
