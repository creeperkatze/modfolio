import { formatNumber, escapeXml, truncateText } from '../utils/formatters.js';
import { ICONS } from '../constants/icons.js';
import { getLoaderColor, getProjectTypeIcon } from '../constants/loaderConfig.js';

export function generateUserCard(data, theme = 'dark')
{
    const { user, stats } = data;
    const isDark = theme === 'dark';

    const bgColor = 'transparent';
    const textColor = isDark ? '#c9d1d9' : '#1e1e2e';
    const accentColor = isDark ? '#1bd96a' : '#1bd96a';
    const secondaryTextColor = isDark ? '#8b949e' : '#4c4f69';
    const borderColor = '#E4E2E2';

    const username = escapeXml(truncateText(user.username, 22));
    const totalDownloads = formatNumber(stats.totalDownloads);
    const projectCount = stats.projectCount;
    const totalFollowers = formatNumber(stats.totalFollowers);

    const topProjects = stats.topProjects.slice(0, 5);
    const hasProjects = topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 120;

    // Calculate max downloads for relative bar sizing
    const maxDownloads = hasProjects ? Math.max(...topProjects.map(p => p.downloads)) : 0;

    // Generate top projects list
    let projectsHtml = '';
    topProjects.forEach((project, index) => {
        const yPos = 160 + (index * 50);
        const projectName = escapeXml(truncateText(project.title, 18));
        const downloads = formatNumber(project.downloads);
        const followers = formatNumber(project.followers || 0);

        // Calculate relative bar width (max 420px width - 10px padding on each side)
        const barWidth = (project.downloads / maxDownloads) * 400;

        // Get project type icon
        const projectTypeIconName = getProjectTypeIcon(project.project_type);
        const projectTypeIcon = ICONS[projectTypeIconName];

        // Get loaders for this project
        const loaders = project.loaders || [];
        let loaderIconsHtml = '';
        loaders.forEach((loader, loaderIndex) => {
            const loaderName = loader.toLowerCase();
            const iconFunc = ICONS[loaderName];
            const loaderColor = getLoaderColor(loaderName);
            if (iconFunc) {
                loaderIconsHtml += `
    <svg x="${54 + (loaderIndex * 18)}" y="${yPos + 2}" width="16" height="16" viewBox="0 0 24 24">
      ${iconFunc(loaderColor)}
    </svg>`;
            }
        });

        const projectIconUrl = project.icon_url_base64 || project.icon_url || '';

        projectsHtml += `
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
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${borderColor}" stroke-width="1" rx="6" vector-effect="non-scaling-stroke"/>

    <!-- Relative downloads bar -->
    <rect x="15" y="${yPos - 18}" width="${barWidth}" height="3" fill="${accentColor}" clip-path="url(#project-clip-${index})"/>

    <!-- Project image -->
    ${projectIconUrl ? `<image x="20" y="${yPos - 12}" width="28" height="28" href="${projectIconUrl}" clip-path="url(#project-icon-clip-${index})"/>` : `<rect x="20" y="${yPos - 12}" width="28" height="28" fill="${borderColor}" rx="4"/>`}

    <text x="54" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Downloads -->
    <text x="380" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${textColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="385" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(textColor)}
    </svg>

    <!-- Follows -->
    <text x="380" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${textColor}" text-anchor="end">
      ${followers}
    </text>
    <svg x="385" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(textColor)}
    </svg>

    <!-- Project type icon (far right, same size as image) -->
    <svg x="405" y="${yPos - 10}" width="24" height="24" viewBox="0 0 24 24">
      ${projectTypeIcon(secondaryTextColor)}
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

  <!-- User Icon -->
  <svg x="58" y="15" width="24" height="24" viewBox="0 0 24 24">
    ${ICONS.user(textColor)}
  </svg>

  <!-- Title -->
  <text x="87" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}
  </text>

  <!-- Profile Picture (upper right) -->
  <defs>
    <clipPath id="profile-clip">
      <circle cx="400" cy="60" r="35"/>
    </clipPath>
  </defs>
  ${user.avatar_url_base64 || user.avatar_url ? `<image x="365" y="25" width="70" height="70" href="${user.avatar_url_base64 || user.avatar_url}" clip-path="url(#profile-clip)"/>` : `<circle cx="400" cy="60" r="35" fill="${borderColor}"/>`}

  <!-- Stats Grid Row 1 -->
  <!-- Total Downloads -->
  <g transform="translate(15, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${totalDownloads}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Total Downloads
    </text>
  </g>

  <!-- Followers -->
  <g transform="translate(155, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${totalFollowers}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Followers
    </text>
  </g>

  <!-- Projects -->
  <g transform="translate(270, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${projectCount}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Projects
    </text>
  </g>

  ${hasProjects ? `<!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>

  <!-- Top Projects Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${textColor}">
    Top Projects
  </text>

  ${projectsHtml}` : ''}

  <!-- Bottom right attribution -->
  <text x="445" y="${height - 5}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="10" fill="${secondaryTextColor}" text-anchor="end" opacity="0.6">
    modrinth-embeds.creeperkatze.de
  </text>
  </g>
</svg>`.trim();
}
