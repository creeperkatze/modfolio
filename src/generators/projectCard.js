import { formatNumber } from "../utils/formatters.js";
import { getProjectTypeIcon } from "../constants/loaderConfig.js";
import { ICONS } from "../constants/icons.js";
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


const DEFAULT_VERSIONS_COUNT = 5;

export function generateProjectCard(data, theme = "dark", options = {})
{
    const { project, versions, stats } = data;
    const {
        showVersions = true,
        maxVersions = DEFAULT_VERSIONS_COUNT,
        color = null
    } = options;

    const colors = getThemeColors(theme, color);

    const projectTypeIconName = getProjectTypeIcon(project.project_type);
    const latestVersions = showVersions ? versions.slice(0, maxVersions) : [];
    const hasVersions = showVersions && latestVersions.length > 0;
    const height = hasVersions ? 150 + (latestVersions.length * 50) : 130;

    const versionDates = versions.map(v => v.date_published);

    const statsData = [
        { x: 15, label: "Downloads", value: formatNumber(stats.downloads) },
        { x: 155, label: "Followers", value: formatNumber(stats.followers) },
        { x: 270, label: "Versions", value: stats.versionCount }
    ];

    const content = `
${generateActivitySparkline(versionDates, colors)}

  <!-- Modrinth Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
    ${ICONS.modrinth(colors.accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(colors.textColor)}
  </svg>

  <!-- Project Type Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${ICONS[projectTypeIconName](colors.textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="Inter, sans-serif"
        font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${project.title.length > 22 ? project.title.substring(0, 22) + "..." : project.title}
  </text>

${generateRectImage(
        project.icon_url_base64,
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
${generateVersionList(latestVersions, colors, options.relativeTime)}
${generateInfo(height, colors)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}
