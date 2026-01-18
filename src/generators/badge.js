import { escapeXml } from '../utils/formatters.js';

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
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    <path d="M 5 1H ${labelWidth}V ${height - 1} H 5A 4 4 0 0 1 1 ${height - 5} V 5A 4 4 0 0 1 5 1Z" fill="${labelBgColor}"/>
    <path d="M ${labelWidth - 1} 1 H ${labelWidth + valueWidth - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 1} 5 V ${height - 5} A 4 4 0 0 1 ${labelWidth + valueWidth - 5} ${height - 1} H ${labelWidth - 1} Z" fill="${color}"/>
  </g>

  <g fill="${textColor}" text-anchor="middle" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="500">
    <text x="${labelWidth / 2}" y="14.5">${escapeXml(label)}</text>
    <text x="${labelWidth + (valueWidth / 2)}" y="14.5">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
