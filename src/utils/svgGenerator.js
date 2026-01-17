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

  const bgColor = isDark ? '#1e1e2e' : '#ffffff';
  const textColor = isDark ? '#cdd6f4' : '#1e1e2e';
  const accentColor = isDark ? '#89fa8f' : '#42f51e';
  const secondaryTextColor = isDark ? '#a6adc8' : '#4c4f69';
  const borderColor = isDark ? '#313244' : '#dce0e8';

  const username = escapeXml(user.username);
  const totalDownloads = formatNumber(stats.totalDownloads);
  const projectCount = stats.projectCount;
  const totalFollowers = formatNumber(stats.totalFollowers);
  const topProjectName = stats.mostPopular ? escapeXml(stats.mostPopular.title) : 'N/A';
  const topProjectDownloads = stats.mostPopular ? formatNumber(stats.mostPopular.downloads) : '0';

  return `
<svg width="450" height="220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="450" height="220" fill="${bgColor}" rx="10" stroke="${borderColor}" stroke-width="1"/>
  <rect width="450" height="120" fill="url(#grad)"/>

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
</svg>`.trim();
}

export function generateTopProjectsCard(data, theme = 'dark') {
  const { user, stats } = data;
  const isDark = theme === 'dark';

  const bgColor = isDark ? '#1e1e2e' : '#ffffff';
  const textColor = isDark ? '#cdd6f4' : '#1e1e2e';
  const accentColor = isDark ? '#89fa8f' : '#42f51e';
  const secondaryTextColor = isDark ? '#a6adc8' : '#4c4f69';
  const borderColor = isDark ? '#313244' : '#dce0e8';
  const barBgColor = isDark ? '#313244' : '#e6e9ef';

  const username = escapeXml(user.username);
  const topProjects = stats.topProjects.slice(0, 5);

  // Calculate bar widths (relative to max downloads)
  const maxDownloads = topProjects[0]?.downloads || 1;

  const height = 120 + (topProjects.length * 45);

  let projectsHtml = '';
  topProjects.forEach((project, index) => {
    const barWidth = (project.downloads / maxDownloads) * 320;
    const yPos = 100 + (index * 45);
    const projectName = escapeXml(project.title.length > 30 ? project.title.substring(0, 27) + '...' : project.title);
    const downloads = formatNumber(project.downloads);

    projectsHtml += `
  <!-- Project ${index + 1} -->
  <g transform="translate(0, ${yPos})">
    <rect x="20" y="0" width="320" height="8" fill="${barBgColor}" rx="4"/>
    <rect x="20" y="0" width="${barWidth}" height="8" fill="${accentColor}" rx="4"/>
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
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="450" height="${height}" fill="${bgColor}" rx="10" stroke="${borderColor}" stroke-width="1"/>
  <rect width="450" height="120" fill="url(#grad)"/>

  <!-- Title -->
  <text x="20" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}'s Top Projects
  </text>

  ${projectsHtml}
</svg>`.trim();
}

export function generateBadge(label, value, color = '#89b4fa') {
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
