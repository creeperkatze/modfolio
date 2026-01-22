import { escapeXml } from "../utils/formatters.js";
import { ICONS } from "../constants/icons.js";

export function generateBadge(label, value, color = "#1bd96a", backgroundColor = null)
{
    const iconWidth = 30;
    const labelWidth = label.length * 7 + 20;
    const valueWidth = value.length * 8 + 20;
    const totalWidth = iconWidth + labelWidth + valueWidth;
    const height = 30;

    // Validate background hex color format
    const isValidBgHex = backgroundColor && /^#[0-9A-F]{6}$/i.test(backgroundColor);
    const bgColor = isValidBgHex ? backgroundColor : "transparent";
    const labelTextColor = "#8b949e";
    const valueTextColor = color;
    const borderColor = "#E4E2E2";

    return `
<svg width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="${totalWidth}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    <line x1="${iconWidth}" y1="1" x2="${iconWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <line x1="${iconWidth + labelWidth}" y1="1" x2="${iconWidth + labelWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
  </g>

  <!-- Modrinth Icon -->
  <svg x="${(iconWidth - 18) / 2}" y="${(height - 18) / 2}" width="18" height="18" viewBox="0 0 512 514">
    ${ICONS.modrinth(color)}
  </svg>

  <g text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500">
    <text x="${iconWidth + (labelWidth / 2)}" y="20 " fill="${labelTextColor}">${escapeXml(label)}</text>
    <text x="${iconWidth + labelWidth + (valueWidth / 2)}" y="21" font-size="16" font-weight="700" letter-spacing="-1" fill="${valueTextColor}">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
