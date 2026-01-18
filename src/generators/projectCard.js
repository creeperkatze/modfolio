import { formatNumber, escapeXml } from '../utils/formatters.js';
import { ICONS } from '../constants/icons.js';
import { getLoaderColor, getProjectTypeIcon } from '../constants/loaderConfig.js';

export function generateProjectCard(data, theme = 'dark')
{
    const { project, versions, stats } = data;
    const isDark = theme === 'dark';

    const bgColor = 'transparent';
    const textColor = isDark ? '#c9d1d9' : '#1e1e2e';
    const accentColor = isDark ? '#1bd96a' : '#1bd96a';
    const secondaryTextColor = isDark ? '#8b949e' : '#4c4f69';
    const borderColor = '#E4E2E2';

    const projectName = escapeXml(project.title);
    const downloads = formatNumber(stats.downloads);
    const followers = formatNumber(stats.followers);
    const versionCount = stats.versionCount;

    // Get project type icon
    const projectTypeIconName = getProjectTypeIcon(project.project_type);
    const projectTypeIcon = ICONS[projectTypeIconName];

    const latestVersions = versions.slice(0, 5);
    const hasVersions = latestVersions.length > 0;
    const height = hasVersions ? 150 + (latestVersions.length * 50) : 110;

    // Generate latest versions list
    let versionsHtml = '';
    latestVersions.forEach((version, index) => {
        const yPos = 160 + (index * 50);
        const versionName = escapeXml(version.name);
        const versionNumber = escapeXml(version.version_number);

        // Format date
        const publishedDate = new Date(version.date_published);
        const dateStr = publishedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Get loaders for this version
        const loaders = version.loaders || [];
        let loaderIconsHtml = '';
        loaders.forEach((loader, loaderIndex) => {
            const loaderName = loader.toLowerCase();
            const iconFunc = ICONS[loaderName];
            const loaderColor = getLoaderColor(loaderName);
            if (iconFunc) {
                loaderIconsHtml += `
    <svg x="${20 + (loaderIndex * 18)}" y="${yPos + 2}" width="16" height="16" viewBox="0 0 24 24">
      ${iconFunc(loaderColor)}
    </svg>`;
            }
        });

        // Get game versions (show first 3)
        const gameVersions = version.game_versions || [];
        const gameVersionsText = gameVersions.slice(0, 3).join(', ') + (gameVersions.length > 3 ? '...' : '');

        // Calculate position for game versions (after loaders with padding)
        const gameVersionsX = 20 + (loaders.length * 18) + 2; // 2px padding after loaders

        // Format downloads for this version
        const versionDownloads = formatNumber(version.downloads || 0);

        versionsHtml += `
  <!-- Version ${index + 1} -->
  <g>
    <defs>
      <clipPath id="version-clip-${index}">
        <rect x="15" y="${yPos - 18}" width="420" height="40" rx="6"/>
      </clipPath>
    </defs>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <text x="20" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${textColor}">
      ${versionNumber}
    </text>

    <!-- Loaders (beneath version name) -->
    ${loaderIconsHtml}

    <!-- Game versions (next to loaders at bottom) -->
    <text x="${gameVersionsX}" y="${yPos + 15}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      ${escapeXml(gameVersionsText)}
    </text>

    <!-- Date -->
    <text x="410" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${textColor}" text-anchor="end">
      ${dateStr}
    </text>
    <svg x="415" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.calendar(textColor)}
    </svg>

    <!-- Downloads (below date) -->
    <text x="410" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${textColor}" text-anchor="end">
      ${versionDownloads}
    </text>
    <svg x="415" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(textColor)}
    </svg>
  </g>`;
    });

    return `
<svg width="450" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="450" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="${height - 1}" vector-effect="non-scaling-stroke"/>

  <!-- Modrinth Icon -->
  <svg x="15" y="15" width="24" height="24" viewBox="0 0 512 514">
    ${ICONS.modrinth(accentColor)}
  </svg>

  <!-- Chevron -->
  <svg x="41" y="15" width="16" height="24" viewBox="0 0 24 24">
    ${ICONS.chevronRight(secondaryTextColor)}
  </svg>

  <!-- Project Type Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${projectTypeIcon(textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${projectName}
  </text>

  <!-- Project Image (upper right) -->
  <defs>
    <clipPath id="project-image-clip">
      <rect x="365" y="25" width="70" height="70" rx="14"/>
    </clipPath>
  </defs>
  ${project.icon_url_base64 || project.icon_url ? `<image x="365" y="25" width="70" height="70" href="${project.icon_url_base64 || project.icon_url}" clip-path="url(#project-image-clip)"/>` : `<rect x="365" y="25" width="70" height="70" rx="14" fill="${borderColor}"/>`}

  <!-- Stats Grid Row 1 -->
  <!-- Total Downloads -->
  <g transform="translate(15, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${downloads}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Downloads
    </text>
  </g>

  <!-- Followers -->
  <g transform="translate(155, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${followers}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Followers
    </text>
  </g>

  <!-- Versions -->
  <g transform="translate(270, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${versionCount}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Versions
    </text>
  </g>

  ${hasVersions ? `<!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>

  <!-- Latest Versions Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${textColor}">
    Latest Versions
  </text>

  ${versionsHtml}` : ''}

  <!-- Bottom right attribution -->
  <text x="445" y="${height - 5}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="10" fill="${secondaryTextColor}" text-anchor="end" opacity="0.6">
    modrinth-embeds.creeperkatze.de
  </text>
  </g>
</svg>`.trim();
}
