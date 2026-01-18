import { formatNumber, escapeXml } from '../utils/formatters.js';
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

    const username = escapeXml(user.username);
    const totalDownloads = formatNumber(stats.totalDownloads);
    const projectCount = stats.projectCount;
    const totalFollowers = formatNumber(stats.totalFollowers);
    const avgDownloads = formatNumber(stats.avgDownloads);

    const topProjects = stats.topProjects.slice(0, 5);
    const hasProjects = topProjects.length > 0;
    const height = hasProjects ? 150 + (topProjects.length * 50) : 110;

    // Calculate max downloads for relative bar sizing
    const maxDownloads = hasProjects ? Math.max(...topProjects.map(p => p.downloads)) : 0;

    // Generate top projects list
    let projectsHtml = '';
    topProjects.forEach((project, index) => {
        const yPos = 160 + (index * 50);
        const projectName = escapeXml(project.title);
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
    <text x="380" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="385" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(secondaryTextColor)}
    </svg>

    <!-- Follows -->
    <text x="380" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${followers}
    </text>
    <svg x="385" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(secondaryTextColor)}
    </svg>

    <!-- Project type icon (far right, same size as image) -->
    <svg x="405" y="${yPos - 10}" width="24" height="24" viewBox="0 0 24 24">
      ${projectTypeIcon(textColor)}
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
    <path fill-rule="evenodd" clip-rule="evenodd" d="M503.16 323.56C514.55 281.47 515.32 235.91 503.2 190.76C466.57 54.2299 326.04 -26.8001 189.33 9.77991C83.8101 38.0199 11.3899 128.07 0.689941 230.47H43.99C54.29 147.33 113.74 74.7298 199.75 51.7098C306.05 23.2598 415.13 80.6699 453.17 181.38L411.03 192.65C391.64 145.8 352.57 111.45 306.3 96.8198L298.56 140.66C335.09 154.13 364.72 184.5 375.56 224.91C391.36 283.8 361.94 344.14 308.56 369.17L320.09 412.16C390.25 383.21 432.4 310.3 422.43 235.14L464.41 223.91C468.91 252.62 467.35 281.16 460.55 308.07L503.16 323.56Z" fill="${accentColor}"/>
    <path d="M321.99 504.22C185.27 540.8 44.7501 459.77 8.11011 323.24C3.84011 307.31 1.17 291.33 0 275.46H43.27C44.36 287.37 46.4699 299.35 49.6799 311.29C53.0399 323.8 57.45 335.75 62.79 347.07L101.38 323.92C98.1299 316.42 95.39 308.6 93.21 300.47C69.17 210.87 122.41 118.77 212.13 94.7601C229.13 90.2101 246.23 88.4401 262.93 89.1501L255.19 133C244.73 133.05 234.11 134.42 223.53 137.25C157.31 154.98 118.01 222.95 135.75 289.09C136.85 293.16 138.13 297.13 139.59 300.99L188.94 271.38L174.07 231.95L220.67 184.08L279.57 171.39L296.62 192.38L269.47 219.88L245.79 227.33L228.87 244.72L237.16 267.79C237.16 267.79 253.95 285.63 253.98 285.64L277.7 279.33L294.58 260.79L331.44 249.12L342.42 273.82L304.39 320.45L240.66 340.63L212.08 308.81L162.26 338.7C187.8 367.78 226.2 383.93 266.01 380.56L277.54 423.55C218.13 431.41 160.1 406.82 124.05 361.64L85.6399 384.68C136.25 451.17 223.84 484.11 309.61 461.16C371.35 444.64 419.4 402.56 445.42 349.38L488.06 364.88C457.17 431.16 398.22 483.82 321.99 504.22Z" fill="${accentColor}"/>
  </svg>

  <!-- Title -->
  <text x="45" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}
  </text>

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
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${secondaryTextColor}">
    Top Projects
  </text>

  ${projectsHtml}` : ''}

  <!-- Bottom right attribution -->
  <text x="445" y="${height - 5}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="10" fill="${secondaryTextColor}" text-anchor="end" opacity="0.6">
    modrinth-readme-stats.creeperkatze.de
  </text>
  </g>
</svg>`.trim();
}
