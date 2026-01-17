export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateUserSummaryCard(data, theme = 'dark') {
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
  const topProjectName = stats.mostPopular ? escapeXml(stats.mostPopular.title) : 'N/A';
  const topProjectDownloads = stats.mostPopular ? formatNumber(stats.mostPopular.downloads) : '0';

  return `
<svg width="450" height="220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="outer_rectangle_summary">
      <rect width="450" height="220" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_summary)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="219"/>

  <!-- Title -->
  <text x="20" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}'s Modrinth Stats
  </text>

  <!-- Stats Grid -->
  <!-- Total Downloads -->
  <g transform="translate(20, 80)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="28" font-weight="bold" fill="${accentColor}">
      ${totalDownloads}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Total Downloads
    </text>
  </g>

  <!-- Projects -->
  <g transform="translate(170, 80)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="28" font-weight="bold" fill="${accentColor}">
      ${projectCount}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Projects
    </text>
  </g>

  <!-- Followers -->
  <g transform="translate(280, 80)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="28" font-weight="bold" fill="${accentColor}">
      ${totalFollowers}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Followers
    </text>
  </g>

  <!-- Divider -->
  <line x1="20" y1="140" x2="430" y2="140" stroke="${borderColor}" stroke-width="1"/>

  <!-- Most Popular Project -->
  <text x="20" y="165" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
    Most Popular Project
  </text>
  <text x="20" y="190" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="16" font-weight="600" fill="${textColor}">
    ${topProjectName}
  </text>
  <text x="430" y="190" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" fill="${accentColor}">
    ${topProjectDownloads} downloads
  </text>
  </g>
</svg>`.trim();
}

export function generateProjectsCard(data, theme = 'dark') {
  const { user, stats } = data;
  const isDark = theme === 'dark';

  const bgColor = 'transparent';
  const textColor = isDark ? '#c9d1d9' : '#1e1e2e';
  const accentColor = isDark ? '#1bd96a' : '#1bd96a';
  const secondaryTextColor = isDark ? '#8b949e' : '#4c4f69';
  const borderColor = '#E4E2E2';
  const barBgColor = 'transparent';

  const username = escapeXml(user.username);
  const topProjects = stats.topProjects.slice(0, 5);

  // Calculate bar widths (relative to max downloads)
  const maxDownloads = topProjects[0]?.downloads || 1;

  const height = 120 + (topProjects.length * 45);

  let projectsHtml = '';
  topProjects.forEach((project, index) => {
    const barWidth = Math.max((project.downloads / maxDownloads) * 320, 8);
    const yPos = 100 + (index * 45);
    const projectName = escapeXml(project.title.length > 30 ? project.title.substring(0, 27) + '...' : project.title);
    const downloads = formatNumber(project.downloads);

    projectsHtml += `
  <!-- Project ${index + 1} -->
  <g transform="translate(0, ${yPos})">
    <rect x="20" y="0" width="320" height="8" fill="${barBgColor}" stroke="${borderColor}" stroke-width="1" rx="4"/>
    <rect x="20.5" y="0.5" width="${barWidth - 1}" height="7" fill="${accentColor}" rx="3.5"/>
    <text x="20" y="25" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" fill="${textColor}">
      ${projectName}
    </text>
    <text x="430" y="25" text-anchor="end" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${accentColor}">
      ${downloads}
    </text>
  </g>`;
  });

  return `
<svg width="450" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="outer_rectangle_projects">
      <rect width="450" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#outer_rectangle_projects)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="${height - 1}"/>

  <!-- Title -->
  <text x="20" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}'s Projects
  </text>

  ${projectsHtml}
  </g>
</svg>`.trim();
}

export function generateBadge(label, value, color = '#1bd96a') {
  const labelWidth = label.length * 7 + 20;
  const valueWidth = value.length * 8 + 20;
  const totalWidth = labelWidth + valueWidth;

  return `
<svg width="${totalWidth}" height="20" xmlns="http://www.w3.org/2000/svg">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>

  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>

  <g clip-path="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>

  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(label)}</text>
    <text x="${labelWidth / 2}" y="14">${escapeXml(label)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="15" fill="#010101" fill-opacity=".3">${escapeXml(value)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="14">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
