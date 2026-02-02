import { formatNumber, escapeXml, truncateText, generateSparkline } from "../utils/formatters.js";
import { formatDistanceToNow } from "date-fns";
import { ICONS } from "../constants/icons.js";
import { getLoaderColor, getProjectTypeIcon } from "../constants/loaderConfig.js";

import packageJson from "../../package.json" with { type: "json" };
const VERSION = packageJson.version;

export function calculateBottomDelay(itemCount)
{
    const ANIMATION_DELAYS = {
        SECTION_HEADER_DELAY: 0.1,
        SECTION_HEADER_TO_FIRST_ITEM_DELAY: 0.1,
        ITEM_DELAY: 0.08,
        BOTTOM_INFO_DELAY: 0.1,
    };
    const firstItemDelay = ANIMATION_DELAYS.SECTION_HEADER_DELAY + ANIMATION_DELAYS.SECTION_HEADER_TO_FIRST_ITEM_DELAY;
    return firstItemDelay + (itemCount * ANIMATION_DELAYS.ITEM_DELAY) + ANIMATION_DELAYS.BOTTOM_INFO_DELAY;
}

export function getThemeColors(customColor = null, backgroundColor = null)
{
    const defaultAccentColor = "#1bd96a";

    // Validate hex color format
    const isValidHex = customColor && /^#[0-9A-F]{6}$/i.test(customColor);
    const accentColor = isValidHex ? customColor : defaultAccentColor;

    // Validate background hex color format
    const isValidBgHex = backgroundColor && /^#[0-9A-F]{6}$/i.test(backgroundColor);
    const bgColor = isValidBgHex ? backgroundColor : "transparent";

    return {
        bgColor,
        textColor: "#c9d1d9",
        accentColor,
        borderColor: "#E4E2E2"
    };
}

export function generateSvgWrapper(width, height, colors, content, showBorder = true, animations = true)
{
    const borderRect = showBorder
        ? `    <rect stroke="${colors.borderColor}" fill="${colors.bgColor}" rx="4.5" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
`
        : `    <rect fill="${colors.bgColor}" rx="4.5" width="${width}" height="${height}"/>
`;

    const styleBlock = animations ? `
  <style>
    @keyframes fadeInAnimation {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInAnimation {
      from { transform: translateX(-10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInFromRightAnimation {
      from { transform: translateX(10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInFromTopAnimation {
      from { transform: translateY(-10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes growWidthAnimation {
      from { width: 0; }
      to { width: var(--target-width); }
    }
    @keyframes sparklineDrawAnimation {
      from { stroke-dashoffset: 1000; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes scaleInX {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    .sparkline-path {
      stroke-dasharray: 1000;
      animation: sparklineDrawAnimation 1s ease-out forwards;
    }
    .section-header {
      opacity: 0;
      animation: fadeInAnimation 0.6s ease-out forwards;
    }
    .fade-in-delayed {
      opacity: 0;
      animation: fadeInAnimation 0.5s ease-out forwards;
    }
    .list-item {
      opacity: 0;
      animation: slideInAnimation 0.4s ease-out forwards;
    }
    .divider {
      animation: fadeInAnimation 0.8s ease-out forwards;
    }
    .download-bar {
      animation: growWidthAnimation 0.6s ease-out forwards;
    }
    .stat-value {
      opacity: 0;
      animation: slideInFromTopAnimation 0.25s ease-out forwards;
    }
    .stat-label {
      opacity: 0;
      animation: slideInFromTopAnimation 0.2s ease-out forwards;
    }
    .profile-image {
      opacity: 0;
      animation: slideInFromRightAnimation 0.4s ease-out forwards;
    }
  </style>` : "";

    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
${styleBlock}
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="${width}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
${borderRect}${content}
  </g>
</svg>`.trim();
}

export function generateActivitySparkline(versionDates, colors, animations = true)
{
    const { path: sparklinePath, fillPath: sparklineFillPath } = generateSparkline(versionDates);
    const sparklineWidth = 420;

    if (!animations) {
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
      opacity="0.4"
    />
    <path
      d="${sparklineFillPath}"
      fill="${colors.accentColor}"
      opacity="0.1"
    />
  </g>`;
    }

    return `
  <!-- Activity Sparkline (background) -->
  <defs>
    <clipPath id="main-sparkline-clip">
      <rect x="0" y="-500" width="${sparklineWidth}" height="1000" style="transform-origin: left center; animation: scaleInX 1s ease-out forwards"/>
    </clipPath>
  </defs>
  <g transform="translate(15, 0)" clip-path="url(#main-sparkline-clip)">
    <path
      d="${sparklinePath}"
      fill="none"
      stroke="${colors.accentColor}"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.4"
    />
    <path
      d="${sparklineFillPath}"
      fill="${colors.accentColor}"
      opacity="0.1"
    />
  </g>`;
}

export function generateHeader(entityType, iconName, title, colors, platformIcon = null, platformIconViewBox = "0 0 512 514")
{
    const icon = ICONS[iconName];
    const platformIconSvg = platformIcon || ICONS.modrinth(colors.accentColor);
    return `
  <!-- Platform Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="${platformIconViewBox}">
    ${platformIconSvg}
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
  <text x="87" y="35" font-family="Inter, sans-serif" font-size="20" font-weight="bold" fill="${colors.textColor}">
    ${escapeXml(truncateText(title, 22))}
  </text>`;
}

export function generateProfileImage(imageUrl, clipId, centerX, centerY, radius, colors, animations = true)
{
    return `
  <defs>
    <clipPath id="${clipId}">
      <circle cx="${centerX}" cy="${centerY}" r="${radius}"/>
    </clipPath>
  </defs>
  <g${animations ? ' class="profile-image"' : ""}>
    ${imageUrl ? `<image x="${centerX - radius}" y="${centerY - radius}" width="${radius * 2}" height="${radius * 2}" href="${imageUrl}" clip-path="url(#${clipId})"/>` : `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${colors.borderColor}"/>`}
  </g>`;
}

export function generateRectImage(imageUrl, clipId, x, y, width, height, borderRadius, colors, animations = true)
{
    return `
  <defs>
    <clipPath id="${clipId}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${borderRadius}"/>
    </clipPath>
  </defs>
  <g${animations ? ' class="profile-image"' : ""}>
    ${imageUrl ? `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${imageUrl}" clip-path="url(#${clipId})"/>` : `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${borderRadius}" fill="${colors.borderColor}"/>`}
  </g>`;
}

export function generateStatsGrid(stats, colors, animations = true)
{
    const valueDelayBase = 0;
    const labelDelayBase = 0.1;
    const statDelayGap = 0.1;

    return stats.map(({ x, label, value }, index) => {
        const valueDelay = valueDelayBase + (index * statDelayGap);
        const labelDelay = labelDelayBase + (index * statDelayGap);
        return `
  <g transform="translate(${x}, 70)">
    <text font-family="Inter, sans-serif" font-size="26" font-weight="bold" fill="${colors.accentColor}"${animations ? ' class="stat-value"' : ""}${animations ? ` style="animation-delay: ${valueDelay}s"` : ""}>
      ${value}
    </text>
    <text y="20" font-family="Inter, sans-serif" font-size="12" fill="${colors.textColor}"${animations ? ' class="stat-label"' : ""}${animations ? ` style="animation-delay: ${labelDelay}s"` : ""}>
      ${label}
    </text>
  </g>`;
    }).join("");
}

export function generateProjectListItem(project, index, totalDownloads, colors, showSparklines = true, showDownloadBars = true, animations = true, baseDelay = 0)
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

    const projectIconUrl = project.icon_url_base64 || "";
    const animationDelay = baseDelay + (index * 0.08);

    return `
  <!-- Project ${index + 1} -->
  <g${animations ? ' class="list-item"' : ""}${animations ? ` style="animation-delay: ${animationDelay}s"` : ""}>
    <defs>
      <clipPath id="project-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
      <clipPath id="project-icon-clip-${index}">
        <rect x="20" y="${yPos - 12}" width="28" height="28" rx="4"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${colors.borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

${showSparklines ? `    <!-- Project version activity sparkline (centered) -->
    <defs>
      <clipPath id="sparkline-clip-${index}">
        <rect x="0" y="-500" width="${sparklineWidth}" height="1000"${animations ? ` style="transform-origin: left center; animation: scaleInX 1s ease-out ${animationDelay}s forwards"` : ""}/>
      </clipPath>
    </defs>
    <g transform="translate(${sparklineXOffset}, ${yPos - 88})" clip-path="url(#sparkline-clip-${index})">
      <path
        d="${projectSparklinePath}"
        fill="none"
        stroke="${colors.accentColor}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        opacity="0.4"
      />
      <path
        d="${projectSparklineFillPath}"
        fill="${colors.accentColor}"
        opacity="0.1"
      />
    </g>` : ""}

${showDownloadBars ? `    <!-- Relative downloads bar -->
    <rect x="15.5" y="${yPos - 18.5}" width="${barWidth - 0.5}" height="3" fill="${colors.accentColor}" clip-path="url(#project-clip-${index})"${animations ? ' class="download-bar"' : ""}${animations ? ` style="--target-width: ${barWidth}px; animation-delay: ${animationDelay + 0.1}s"` : ""}/>` : ""}

    <!-- Project image -->
    ${projectIconUrl ? `<image x="20" y="${yPos - 12}" width="28" height="28" href="${projectIconUrl}" clip-path="url(#project-icon-clip-${index})"/>` : `<rect x="20" y="${yPos - 12}" width="28" height="28" fill="${colors.borderColor}" rx="4"/>`}

    <text x="54" y="${yPos - 2}" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="${colors.textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Downloads -->
    <text x="380" y="${yPos}" font-family="Inter, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="385" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(colors.textColor)}
    </svg>

    <!-- Follows -->
    <text x="380" y="${yPos + 18}" font-family="Inter, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
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

export function generateDivider(colors, animations = true)
{
    return `
  <!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${colors.borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"${animations ? ' class="divider"' : ""}/>`;
}

export function generateProjectList(topProjects, sectionTitle, colors, showSparklines = true, showDownloadBars = true, animations = true)
{
    if (!topProjects || topProjects.length === 0) return "";

    const totalDownloads = topProjects.reduce((sum, p) => sum + p.downloads, 0);
    const sectionDelay = 0.1;
    const firstProjectDelay = sectionDelay + 0.1;

    const projectsHtml = topProjects.map((project, index) =>
        generateProjectListItem(project, index, totalDownloads, colors, showSparklines, showDownloadBars, animations, firstProjectDelay)
    ).join("");

    return `
  <!-- Projects Header -->
  <text x="15" y="130" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="${colors.textColor}"${animations ? ` class="section-header" style="animation-delay: ${sectionDelay}s"` : ""}>
    ${sectionTitle}
  </text>

  ${projectsHtml}`;
}

export function generateVersionListItem(version, index, colors, relativeTime, animations = true)
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
    const animationDelay = 0.3 + (index * 0.08);

    return `
  <!-- Version ${index + 1} -->
  <g${animations ? ' class="list-item"' : ""}${animations ? ` style="animation-delay: ${animationDelay}s"` : ""}>
    <defs>
      <clipPath id="version-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${colors.borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <text x="20" y="${yPos - 2}" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="${colors.textColor}">
      ${versionNumber}
    </text>

    <!-- Loaders (beneath version name) -->
    ${loaderIconsHtml}

    <!-- Game versions (next to loaders at bottom) -->
    <text x="${gameVersionsX}" y="${yPos + 15}" font-family="Inter, sans-serif" font-size="12" fill="${colors.textColor}">
      ${escapeXml(gameVersionsText)}
    </text>

    <!-- Date -->
    <text x="410" y="${yPos}" font-family="Inter, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${dateStr}
    </text>
    <g transform="translate(415, ${yPos - 12}) scale(${14 / 24})">
      ${ICONS.calendar(colors.textColor)}
    </g>

    <!-- Downloads (below date) -->
    <text x="410" y="${yPos + 18}" font-family="Inter, sans-serif" font-size="11" fill="${colors.textColor}" text-anchor="end">
      ${versionDownloads}
    </text>
    <g transform="translate(415, ${yPos + 6}) scale(${14 / 24})">
      ${ICONS.download(colors.textColor)}
    </g>
  </g>`;
}

export function generateVersionList(versions, colors, relativeTime, headerText = "Latest Versions", animations = true)
{
    if (!versions || versions.length === 0) return "";

    const versionsHtml = versions.map((version, index) =>
        generateVersionListItem(version, index, colors, relativeTime, animations)
    ).join("");

    return `
  <!-- Versions Header -->
  <text x="15" y="130" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="${colors.textColor}"${animations ? ' class="section-header" style="animation-delay: 0.2s"' : ""}>
    ${escapeXml(headerText)}
  </text>

  ${versionsHtml}`;
}

export function generateAttribution(height, colors, animations, animationDelay)
{
    return `
  <!-- Bottom right attribution -->
  <text x="435" y="${height - 5}" font-family="Inter, sans-serif" font-size="10" fill="${colors.textColor}" text-anchor="end"${animations ? ` class="fade-in-delayed" style="animation-delay: ${animationDelay}s"` : ""}>
    modfolio.creeperkatze.de
  </text>`;
}

export function generateInfo(height, colors, fromCache = false, animations, animationDelay)
{
    const now = new Date();
    const dateTimeStr = now.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const versionText = `v${VERSION} • ${dateTimeStr}`;
    const cacheHtml = fromCache ? `
  <!-- Cache icon -->
  <g opacity="0.6"${animations ? ` class="fade-in-delayed" style="animation-delay: ${animationDelay}s"` : ""}>
    <svg x="15" y="${height - 15}" width="12" height="12" viewBox="0 0 24 24">
      ${ICONS["database-zap"](colors.textColor)}
    </svg>
  </g>` : "";

    return `
  <!-- Bottom left version + date -->
  <text x="${fromCache ? 30 : 15}" y="${height - 5}"
        font-family="Inter, sans-serif"
        font-size="10"
        fill="${colors.textColor}"
        text-anchor="start"${animations ? ` class="fade-in-delayed" style="animation-delay: ${animationDelay}s"` : ""}>
    ${versionText}
  </text>
${cacheHtml}`;
}
