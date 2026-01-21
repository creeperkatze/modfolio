import { formatNumber, escapeXml, truncateText, generateSparkline } from "../utils/formatters.js";
import { formatDistanceToNow } from "date-fns";
import { ICONS } from "../constants/icons.js";
import { getLoaderColor, getProjectTypeIcon } from "../constants/loaderConfig.js";

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

export function getThemeColors(theme = "dark", customColor = null)
{
    const isDark = theme === "dark";
    const defaultAccentColor = "#1bd96a";

    // Validate hex color format
    const isValidHex = customColor && /^#[0-9A-F]{6}$/i.test(customColor);
    const accentColor = isValidHex ? customColor : defaultAccentColor;

    return {
        bgColor: "transparent",
        textColor: isDark ? "#c9d1d9" : "#1e1e2e",
        accentColor,
        borderColor: "#E4E2E2"
    };
}

export function generateSvgWrapper(width, height, colors, content)
{
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="${width}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
    <rect stroke="${colors.borderColor}" fill="${colors.bgColor}" rx="4.5" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
${content}
  </g>
</svg>`.trim();
}

export function generateActivitySparkline(versionDates, colors)
{
    const { path: sparklinePath, fillPath: sparklineFillPath } = generateSparkline(versionDates);
    return `
  <!-- Activity Sparkline (background) -->
  <g transform="translate(15, 0)">
    <path
      d="${sparklinePath}"
      fill="none"
      stroke="${colors.accentColor}"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.3"
    />
    <path
      d="${sparklineFillPath}"
      fill="${colors.accentColor}"
      opacity="0.05"
    />
  </g>`;
}

export function generateHeader(entityType, iconName, title, colors)
{
    const icon = ICONS[iconName];
    return `
  <!-- Modrinth Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
    ${ICONS.modrinth(colors.accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(colors.textColor)}
  </svg>

  <!-- Entity Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${icon(colors.textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${escapeXml(truncateText(title, 22))}
  </text>`;
}

export function generateProfileImage(imageUrl, clipId, centerX, centerY, radius, colors)
{
    return `
  <defs>
    <clipPath id="${clipId}">
      <circle cx="${centerX}" cy="${centerY}" r="${radius}"/>
    </clipPath>
  </defs>
  ${imageUrl ? `<image x="${centerX - radius}" y="${centerY - radius}" width="${radius * 2}" height="${radius * 2}" href="${imageUrl}" clip-path="url(#${clipId})"/>` : `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${colors.borderColor}"/>`}`;
}

export function generateRectImage(imageUrl, clipId, x, y, width, height, borderRadius, colors)
{
    return `
  <defs>
    <clipPath id="${clipId}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${borderRadius}"/>
    </clipPath>
  </defs>
  ${imageUrl ? `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${imageUrl}" clip-path="url(#${clipId})"/>` : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${borderRadius}" fill="${colors.borderColor}"/>`}`;
}

export function generateStatsGrid(stats, colors)
{
    return stats.map(({ x, label, value }) => `
  <g transform="translate(${x}, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${colors.accentColor}">
      ${value}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${colors.textColor}">
      ${label}
    </text>
  </g>`).join("");
}

export function generateProjectListItem(project, index, totalDownloads, colors)
{
    const yPos = 160 + (index * 50);
    const projectName = escapeXml(truncateText(project.title, 18));
    const downloads = formatNumber(project.downloads);
    const followers = formatNumber(project.followers || 0);
    const barWidth = (project.downloads / totalDownloads) * 420;

    const projectVersionDates = project.versionDates || [];
    const sparklineWidth = 420 * 0.6; // Center 60% of width
    const sparklineHeight = 40 * 0.75;
    const { path: projectSparklinePath, fillPath: projectSparklineFillPath } = generateSparkline(projectVersionDates, sparklineWidth, sparklineHeight);
    const sparklineXOffset = 15 + (420 * 0.2); // Center horizontally (20% margin on each side)

    const projectTypeIconName = getProjectTypeIcon(project.project_type);
    const projectTypeIcon = ICONS[projectTypeIconName];

    const loaders = project.loaders || [];
    const loaderIconsHtml = loaders.map((loader, loaderIndex) =>
    {
        const loaderName = loader.toLowerCase();
        const iconFunc = ICONS[loaderName];
        const loaderColor = getLoaderColor(loaderName);
        if (!iconFunc) return "";
        return `
    <svg x="${54 + (loaderIndex * 18)}" y="${yPos + 2}" width="16" height="16" viewBox="0 0 24 24">
      ${iconFunc(loaderColor)}
    </svg>`;
    }).join("");

    const projectIconUrl = project.icon_url_base64 || project.icon_url || "";

    return `
  <!-- Project ${index + 1} -->
  <g>
    <defs>
      <clipPath id="project-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
      <clipPath id="project-icon-clip-${index}">
        <rect x="20" y="${yPos - 12}" width="28" height="28" rx="4"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${colors.borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <!-- Project version activity sparkline (centered) -->
    <g clip-path="url(#project-clip-${index})">
      <g transform="translate(${sparklineXOffset}, ${yPos - 88})">
        <path
          d="${projectSparklinePath}"
          fill="none"
          stroke="${colors.accentColor}"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.3"
        />
        <path
          d="${projectSparklineFillPath}"
          fill="${colors.accentColor}"
          opacity="0.05"
        />
      </g>
    </g>

    <!-- Relative downloads bar -->
    <rect x="15" y="${yPos - 17.5}" width="${barWidth}" height="3" fill="${colors.accentColor}" clip-path="url(#project-clip-${index})"/>

    <!-- Project image -->
    ${projectIconUrl ? `<image x="20" y="${yPos - 12}" width="28" height="28" href="${projectIconUrl}" clip-path="url(#project-icon-clip-${index})"/>` : `<rect x="20" y="${yPos - 12}" width="28" height="28" fill="${colors.borderColor}" rx="4"/>`}

    <text x="54" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${colors.textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Downloads -->
    <text x="380" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="385" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(colors.textColor)}
    </svg>

    <!-- Follows -->
    <text x="380" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${followers}
    </text>
    <svg x="385" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(colors.textColor)}
    </svg>

    <!-- Project type icon (far right, same size as image) -->
    <svg x="405" y="${yPos - 10}" width="24" height="24" viewBox="0 0 24 24">
      ${projectTypeIcon(colors.textColor)}
    </svg>
  </g>`;
}

export function generateDivider(colors)
{
    return `
  <!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${colors.borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
}

export function generateProjectList(topProjects, sectionTitle, colors)
{
    if (!topProjects || topProjects.length === 0) return "";

    const totalDownloads = topProjects.reduce((sum, p) => sum + p.downloads, 0);
    const projectsHtml = topProjects.map((project, index) =>
        generateProjectListItem(project, index, totalDownloads, colors)
    ).join("");

    return `
  <!-- Projects Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${colors.textColor}">
    ${sectionTitle}
  </text>

  ${projectsHtml}`;
}

export function generateVersionListItem(version, index, colors, relativeTime)
{
    const yPos = 160 + (index * 50);
    const versionNumber = escapeXml(truncateText(version.version_number, 18));

    const publishedDate = new Date(version.date_published);

    const dateStr = relativeTime
        ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true })
        : publishedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });

    const loaders = version.loaders || [];
    const loaderIconsHtml = loaders.map((loader, loaderIndex) =>
    {
        const loaderName = loader.toLowerCase();
        const iconFunc = ICONS[loaderName];
        const loaderColor = getLoaderColor(loaderName);
        if (!iconFunc) return "";
        return `
    <svg x="${20 + (loaderIndex * 18)}" y="${yPos + 2}" width="16" height="16" viewBox="0 0 24 24">
      ${iconFunc(loaderColor)}
    </svg>`;
    }).join("");

    const gameVersions = version.game_versions || [];
    const gameVersionsText = gameVersions.slice(0, 3).join(", ") + (gameVersions.length > 3 ? "..." : "");
    const gameVersionsX = 20 + (loaders.length * 18) + 2;
    const versionDownloads = formatNumber(version.downloads || 0);

    return `
  <!-- Version ${index + 1} -->
  <g>
    <defs>
      <clipPath id="version-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${colors.borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <text x="20" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${colors.textColor}">
      ${versionNumber}
    </text>

    <!-- Loaders (beneath version name) -->
    ${loaderIconsHtml}

    <!-- Game versions (next to loaders at bottom) -->
    <text x="${gameVersionsX}" y="${yPos + 15}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${colors.textColor}">
      ${escapeXml(gameVersionsText)}
    </text>

    <!-- Date -->
    <text x="410" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${dateStr}
    </text>
    <svg x="415" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.calendar(colors.textColor)}
    </svg>

    <!-- Downloads (below date) -->
    <text x="410" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${versionDownloads}
    </text>
    <svg x="415" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(colors.textColor)}
    </svg>
  </g>`;
}

export function generateVersionList(versions, colors, relativeTime)
{
    if (!versions || versions.length === 0) return "";

    const versionsHtml = versions.map((version, index) =>
        generateVersionListItem(version, index, colors, relativeTime)
    ).join("");

    return `
  <!-- Latest Versions Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${colors.textColor}">
    Latest Versions
  </text>

  ${versionsHtml}`;
}

export function generateAttribution(height, colors)
{
    return `
  <!-- Bottom right attribution -->
  <text x="435" y="${height - 5}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="10" fill="${colors.textColor}" text-anchor="end" opacity="0.6">
    modrinth-embeds.creeperkatze.de
  </text>`;
}

export function generateInfo(height, colors)
{
    const now = new Date();
    const dateTimeStr = now.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    return `
  <!-- Bottom left version + date -->
  <text x="15" y="${height - 5}"
        font-family="'Segoe UI', Ubuntu, sans-serif"
        font-size="10"
        fill="${colors.textColor}"
        text-anchor="start"
        opacity="0.6">
    v${VERSION} • ${dateTimeStr}
  </text>`;
}
