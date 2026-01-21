import { formatNumber } from "../utils/formatters.js";
import {
    getThemeColors,
    generateSvgWrapper,
    generateActivitySparkline,
    generateHeader,
    generateProfileImage,
    generateStatsGrid,
    generateDivider,
    generateProjectList,
    generateAttribution,
    generateInfo
} from "./svgComponents.js";

const DEFAULT_PROJECTS_COUNT = 5;

export function generateUserCard(data, theme = "dark", options = {})
{
    const { user, stats } = data;
    const {
        showProjects = true,
        maxProjects = DEFAULT_PROJECTS_COUNT,
        color = null
    } = options;

    const colors = getThemeColors(theme, color);

    const topProjects = showProjects ? stats.topProjects.slice(0, maxProjects) : [];
    const hasProjects = showProjects && topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 130;

    const statsData = [
        { x: 15, label: "Total Downloads", value: formatNumber(stats.totalDownloads) },
        { x: 155, label: "Followers", value: formatNumber(stats.totalFollowers) },
        { x: 270, label: "Projects", value: stats.projectCount }
    ];

    const content = `
${generateActivitySparkline(stats.allVersionDates || [], colors)}
${generateHeader("user", "user", user.username, colors)}
${generateProfileImage(user.avatar_url_base64, "profile-clip", 400, 60, 35, colors)}
${generateStatsGrid(statsData, colors)}
${generateDivider(colors)}
${generateProjectList(topProjects, "Top Projects", colors)}
${generateInfo(height, colors)}
${generateAttribution(height, colors)}
`;

    return generateSvgWrapper(450, height, colors, content);
}
