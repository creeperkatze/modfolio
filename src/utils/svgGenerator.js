export function formatNumber(num)
{
    if (num >= 1000000)
    {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000)
    {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function escapeXml(unsafe)
{
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Icon definitions
const ICONS = {
    download: (color = 'currentColor') => `
        <path d="M12 15V3" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="m7 10 5 5 5-5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    heart: (color = 'currentColor') => `
        <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
    fabric: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="23" d="m820 761-85.6-87.6c-4.6-4.7-10.4-9.6-25.9 1-19.9 13.6-8.4 21.9-5.2 25.4 8.2 9 84.1 89 97.2 104 2.5 2.8-20.3-22.5-6.5-39.7 5.4-7 18-12 26-3 6.5 7.3 10.7 18-3.4 29.7-24.7 20.4-102 82.4-127 103-12.5 10.3-28.5 2.3-35.8-6-7.5-8.9-30.6-34.6-51.3-58.2-5.5-6.3-4.1-19.6 2.3-25 35-30.3 91.9-73.8 111.9-90.8" transform="matrix(.08671 0 0 .0867 -49.8 -56)"/>
    `,
    quilt: (color = 'currentColor') => `
        <defs>
            <path id="quilt-piece" fill="none" stroke="${color}" stroke-width="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197Z"/>
        </defs>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 -3.2 -3.2)"/>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 -3.2 7)"/>
        <use href="#quilt-piece" stroke-width="65.6" transform="matrix(.03053 0 0 .03046 6.9 -3.2)"/>
        <path fill="none" stroke="${color}" stroke-width="70.4" d="M442.5 234.8c0-7-5.6-12.5-12.5-12.5H234.7c-6.8 0-12.4 5.6-12.4 12.5V430c0 6.9 5.6 12.5 12.4 12.5H430c6.9 0 12.5-5.6 12.5-12.5V234.8Z" transform="rotate(45 3.5 24) scale(.02843 .02835)"/>
    `,
    forge: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="2" d="M2 7.5h8v-2h12v2s-7 3.4-7 6 3.1 3.1 3.1 3.1l.9 3.9H5l1-4.1s3.8.1 4-2.9c.2-2.7-6.5-.7-8-6Z"/>
    `,
    neoforge: (color = 'currentColor') => `
        <g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="m12 19.2v2m0-2v2"/>
            <path d="m8.4 1.3c0.5 1.5 0.7 3 0.1 4.6-0.2 0.5-0.9 1.5-1.6 1.5m8.7-6.1c-0.5 1.5-0.7 3-0.1 4.6 0.2 0.6 0.9 1.5 1.6 1.5"/>
            <path d="m3.6 15.8h-1.7m18.5 0h1.7"/>
            <path d="m3.2 12.1h-1.7m19.3 0h1.8"/>
            <path d="m8.1 12.7v1.6m7.8-1.6v1.6"/>
            <path d="m10.8 18h1.2m0 1.2-1.2-1.2m2.4 0h-1.2m0 1.2 1.2-1.2"/>
            <path d="m4 9.7c-0.5 1.2-0.8 2.4-0.8 3.7 0 3.1 2.9 6.3 5.3 8.2 0.9 0.7 2.2 1.1 3.4 1.1m0.1-17.8c-1.1 0-2.1 0.2-3.2 0.7m11.2 4.1c0.5 1.2 0.8 2.4 0.8 3.7 0 3.1-2.9 6.3-5.3 8.2-0.9 0.7-2.2 1.1-3.4 1.1m-0.1-17.8c1.1 0 2.1 0.2 3.2 0.7"/>
            <path d="m4 9.7c-0.2-1.8-0.3-3.7 0.5-5.5s2.2-2.6 3.9-3m11.6 8.5c0.2-1.9 0.3-3.7-0.5-5.5s-2.2-2.6-3.9-3"/>
            <path d="m12 21.2-2.4 0.4m2.4-0.4 2.4 0.4"/>
        </g>
    `,
    paper: (color = 'currentColor') => `
        <path fill="none" stroke="${color}" stroke-width="2" d="m12 18 6 2 3-17L2 14l6 2"/>
        <path stroke="${color}" stroke-width="2" d="m9 21-1-5 4 2-3 3Z"/>
        <path fill="${color}" d="m12 18-4-2 10-9-6 11Z"/>
    `,
    spigot: (color = 'currentColor') => `
        <path stroke="${color}" fill="none" stroke-width="24" d="M147.5,27l27,-15l27.5,15l66.5,0l0,33.5l-73,-0.912l0,45.5l26,-0.088l0,31.5l-12.5,0l0,15.5l16,21.5l35,0l0,-21.5l35.5,0l0,21.5l24.5,0l0,55.5l-24.5,0l0,17l-35.5,0l0,-27l-35,0l-55.5,14.5l-67.5,-14.5l-15,14.5l18,12.5l-3,24.5l-41.5,1.5l-48.5,-19.5l6,-19l24.5,-4.5l16,-41l79,-36l-7,-15.5l0,-31.5l23.5,0l0,-45.5l-73.5,0l0,-32.5l67,0Z" transform="scale(.072)"/>
    `,
    bukkit: (color = 'currentColor') => `
        <path stroke="${color}" fill="none" stroke-width="24" d="M12,109.5L12,155L34.5,224L57.5,224L57.5,271L81,294L160,294L160,172L259.087,172L265,155L265,109.5M12,109.5L12,64L34.5,64L34.5,41L81,17L195.5,17L241,41L241,64L265,64L265,109.5M12,109.5L81,109.5L81,132L195.5,132L195.5,109.5L265,109.5M264.087,204L264.087,244M207.5,272L207.5,312M250,272L250,312L280,312L280,272L250,272ZM192.5,204L192.5,204L222.5,244L222.5,204L192.5,204Z" transform="matrix(1,0,0,1,0,-5) scale(.075)"/>
    `,
    purpur: (color = 'currentColor') => `
        <defs>
            <path id="purpur-piece" fill="none" stroke="${color}" stroke-width="1.68" d="m264 41.95 8-4v8l-8 4v-8Z"/>
        </defs>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m264 29.95-8 4 8 4.42 8-4.42-8-4Z" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m272 38.37-8 4.42-8-4.42" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="m260 31.95 8 4.21V45" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <path fill="none" stroke="${color}" stroke-width="1.77" d="M260 45v-8.84l8-4.21" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
        <use href="#purpur-piece" stroke-width="1.68" transform="matrix(1.125 0 0 1.2569 -285 -40.78)"/>
        <use href="#purpur-piece" stroke-width="1.68" transform="matrix(-1.125 0 0 1.2569 309 -40.78)"/>
    `,
    vanilla: (color = 'currentColor') => `
        <path fill="${color}" fill-rule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clip-rule="evenodd"/>
    `
};

function getLoaderColor(loader) {
    const colors = {
        fabric: '#8a7b71',
        quilt: '#8b61b4',
        forge: '#5b6197',
        neoforge: '#dc895c',
        liteloader: '#4c90de',
        bukkit: '#e78362',
        bungeecord: '#c69e39',
        folia: '#6aa54f',
        paper: '#e67e7e',
        purpur: '#7763a3',
        spigot: '#cd7a21',
        velocity: '#4b98b0',
        waterfall: '#5f83cb',
        sponge: '#c49528',
        ornithe: '#6097ca',
        'bta-babric': '#5ba938',
        'legacy-fabric': '#6879f6',
        nilloader: '#dd5088',
        minecraft: '#62C940'
    };
    return colors[loader.toLowerCase()] || '#8b949e';
}

export function generateUserSummaryCard(data, theme = 'dark')
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
    const height = 150 + (topProjects.length * 50);

    // Generate top projects list
    let projectsHtml = '';
    topProjects.forEach((project, index) => {
        const yPos = 160 + (index * 50);
        const projectName = escapeXml(project.title.length > 20 ? project.title.substring(0, 17) + '...' : project.title);
        const downloads = formatNumber(project.downloads);
        const followers = formatNumber(project.followers || 0);

        // Get loaders for this project
        const loaders = project.loaders || [];
        let loaderIconsHtml = '';
        loaders.slice(0, 3).forEach((loader, loaderIndex) => {
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

        projectsHtml += `
  <!-- Project ${index + 1} -->
  <g>
    <rect x="15" y="${yPos - 18}" width="420" height="40" fill="none" stroke="${borderColor}" stroke-width="1" rx="6"/>

    <text x="20" y="${yPos - 2}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="13" font-weight="600" fill="${textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Downloads -->
    <text x="410" y="${yPos}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${downloads}
    </text>
    <svg x="415" y="${yPos - 12}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(secondaryTextColor)}
    </svg>

    <!-- Follows -->
    <text x="410" y="${yPos + 18}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}" text-anchor="end">
      ${followers}
    </text>
    <svg x="415" y="${yPos + 6}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(secondaryTextColor)}
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
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="449" height="${height - 1}"/>

  <!-- Title -->
  <text x="15" y="35" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="20" font-weight="bold" fill="${textColor}">
    ${username}'s Modrinth Stats
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

  <!-- Projects -->
  <g transform="translate(155, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${projectCount}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Projects
    </text>
  </g>

  <!-- Followers -->
  <g transform="translate(240, 70)">
    <text font-family="'Segoe UI', Ubuntu, sans-serif" font-size="26" font-weight="bold" fill="${accentColor}">
      ${totalFollowers}
    </text>
    <text y="20" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" fill="${secondaryTextColor}">
      Followers
    </text>
  </g>

  <!-- Divider -->
  <line x1="15" y1="110" x2="435" y2="110" stroke="${borderColor}" stroke-width="1"/>

  <!-- Top Projects Header -->
  <text x="15" y="130" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${secondaryTextColor}">
    Top Projects
  </text>

  ${projectsHtml}
  </g>
</svg>`.trim();
}

export function generateProjectsCard(data, theme = 'dark')
{
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

    const height = 120 + (topProjects.length * 75);

    let projectsHtml = '';
    topProjects.forEach((project, index) =>
    {
        const barWidth = Math.max((project.downloads / maxDownloads) * 320, 8);
        const yPos = 100 + (index * 75);
        const projectName = escapeXml(project.title.length > 30 ? project.title.substring(0, 27) + '...' : project.title);
        const downloads = formatNumber(project.downloads);
        const followers = formatNumber(project.followers || 0);
        const projectType = escapeXml((project.project_type || 'mod').charAt(0).toUpperCase() + (project.project_type || 'mod').slice(1));

        // Get loaders for this project
        const loaders = project.loaders || [];
        let loaderIconsHtml = '';
        loaders.slice(0, 4).forEach((loader, loaderIndex) => {
            const loaderName = loader.toLowerCase();
            const iconFunc = ICONS[loaderName];
            if (iconFunc) {
                loaderIconsHtml += `
    <svg x="${25 + (loaderIndex * 24)}" y="${yPos + 30}" width="20" height="20" viewBox="0 0 24 24">
      ${iconFunc()}
    </svg>`;
            }
        });

        projectsHtml += `
  <!-- Project ${index + 1} -->
  <g>
    <rect x="15" y="${yPos - 5}" width="420" height="65" fill="none" stroke="${borderColor}" stroke-width="1" rx="6"/>
    <rect x="25" y="${yPos}" width="320" height="8" fill="${barBgColor}" stroke="${borderColor}" stroke-width="1" rx="4"/>
    <rect x="25.5" y="${yPos + 0.5}" width="${barWidth - 1}" height="7" fill="${accentColor}" rx="3.5"/>
    <text x="25" y="${yPos + 25}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="14" font-weight="600" fill="${textColor}">
      ${projectName}
    </text>

    <!-- Loaders -->
    ${loaderIconsHtml}

    <!-- Heart icon + count -->
    <svg x="360" y="${yPos + 35}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.heart(secondaryTextColor)}
    </svg>
    <text x="377" y="${yPos + 47}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}">
      ${followers}
    </text>

    <!-- Download icon + count -->
    <svg x="360" y="${yPos + 13}" width="14" height="14" viewBox="0 0 24 24">
      ${ICONS.download(secondaryTextColor)}
    </svg>
    <text x="377" y="${yPos + 25}" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" fill="${secondaryTextColor}">
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

export function generateBadge(label, value, color = '#1bd96a')
{
    const labelWidth = label.length * 7 + 20;
    const valueWidth = value.length * 8 + 20;
    const totalWidth = labelWidth + valueWidth;
    const height = 20;

    const bgColor = 'transparent';
    const labelBgColor = '#8b949e';
    const textColor = '#ffffff';
    const borderColor = '#E4E2E2';

    return `
<svg width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="${totalWidth}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}"/>
    <path d="M 5 1H ${labelWidth}V ${height - 1} H 5A 4 4 0 0 1 1 ${height - 5} V 5A 4 4 0 0 1 5 1Z" fill="${labelBgColor}"/>
    <path d="M ${labelWidth - 1} 1 H ${labelWidth + valueWidth - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 1} 5 V ${height - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 5} ${height - 1} H ${labelWidth - 1} Z" fill="${color}"/>
  </g>

  <g fill="${textColor}" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="500">
    <text x="${labelWidth / 2}" y="14.5">${escapeXml(label)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="14.5">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
