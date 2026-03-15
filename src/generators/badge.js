import { escapeXml } from "../utils/formatters.js";
import { PLATFORMS, getPlatform } from "../constants/platforms.js";

// Janky af
function estimateTextWidth(text, fontSize)
{
    const narrow = "iljtIrf1 ";
    const wide = "mwWM0";
    let width = 0;
    for (const char of text) {
        if (narrow.includes(char)) {
            width += fontSize * 0.3;
        } else if (wide.includes(char)) {
            width += fontSize * 0.75;
        } else {
            width += fontSize * 0.55;
        }
    }
    return Math.ceil(width);
}

export function generateBadge(label, value, platformId, color = null, backgroundColor = null, valueColor = null, showIcon = true, showBorder = true)
{
    const platform = getPlatform(platformId) || PLATFORMS.MODRINTH;
    const badgeColor = color || platform.defaultColor;
    const icon = showIcon ? platform.icon(badgeColor) : null;

    const iconWidth = showIcon ? 30 : 0;
    const paddingX = 10;
    const labelWidth = estimateTextWidth(label, 14)  + paddingX * 2;
    const valueWidth = estimateTextWidth(value, 16) + paddingX * 2;
    const totalWidth = iconWidth + labelWidth + valueWidth;
    const height = 30;

    // Validate background hex color format
    const isValidBgHex = backgroundColor && /^#[0-9A-F]{6}$/i.test(backgroundColor);
    const bgColor = isValidBgHex ? backgroundColor : "transparent";
    const labelTextColor = "#8b949e";
    const valueTextColor = valueColor || badgeColor;
    const borderColor = "#E4E2E2";

    // Get icon viewBox - Modrinth uses 0 0 512 514, CurseForge uses 0 0 32 32, Hangar/Spigot use 0 0 100 100
    const iconViewBox = platformId === "curseforge" ? "0 0 32 32" : platformId === "hangar" || platformId === "spigot" ? "0 0 100 100" : "0 0 512 514";

    return `
<svg width="${totalWidth}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="badge_clip">
      <rect width="${totalWidth}" height="${height}" rx="4.5"/>
    </clipPath>
  </defs>
  <g clip-path="url(#badge_clip)">
    <rect ${showBorder ? `stroke="${borderColor}"` : ""} fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    ${showBorder && !!showIcon ? `<line x1="${iconWidth}" y1="1" x2="${iconWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>` : ""}
    ${showBorder ? `<line x1="${iconWidth + labelWidth}" y1="1" x2="${iconWidth + labelWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>` : ""}
  </g>
  ${!!showIcon ? `<!-- Platform Icon -->
  <svg x="${(iconWidth - 18) / 2}" y="${(height - 18) / 2}" width="18" height="18" viewBox="${iconViewBox}">
    ${icon}
  </svg>` : ""}
  <g font-family="Inter, sans-serif" font-size="14" font-weight="500">
    <text x="${iconWidth + labelWidth / 2}" y="20" text-anchor="middle" fill="${labelTextColor}">${escapeXml(label)}</text>
    <text x="${iconWidth + labelWidth + valueWidth / 2}" y="21" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="-1" fill="${valueTextColor}">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
