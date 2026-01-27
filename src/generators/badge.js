import { escapeXml } from "../utils/formatters.js";
import { PLATFORMS, getPlatform } from "../constants/platforms.js";

/**
 * Generate a platform badge SVG.
 *
 * @param {string} label - The badge label (e.g., "Downloads", "Followers")
 * @param {string} value - The badge value (e.g., "1.2K", "42")
 * @param {string} [platformId="modrinth"] - The platform ID for icon and default color
 * @param {string} [color] - Custom color (overrides platform default)
 * @param {string|null} [backgroundColor] - Optional background color hex
 * @returns {string} The SVG badge markup
 */
export function generateBadge(label, value, platformId = "modrinth", color = null, backgroundColor = null)
{
    const platform = getPlatform(platformId) || PLATFORMS.MODRINTH;
    const badgeColor = color || platform.defaultColor;
    const icon = platform.icon(badgeColor);

    const iconWidth = 30;
    const labelWidth = label.length * 7 + 20;
    const valueWidth = value.length * 8 + 20;
    const totalWidth = iconWidth + labelWidth + valueWidth;
    const height = 30;

    // Validate background hex color format
    const isValidBgHex = backgroundColor && /^#[0-9A-F]{6}$/i.test(backgroundColor);
    const bgColor = isValidBgHex ? backgroundColor : "transparent";
    const labelTextColor = "#8b949e";
    const valueTextColor = badgeColor;
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
    <rect stroke="${borderColor}" fill="${bgColor}" rx="4.5" x="0.5" y="0.5" width="${totalWidth - 1}" height="${height - 1}" vector-effect="non-scaling-stroke"/>
    <line x1="${iconWidth}" y1="1" x2="${iconWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <line x1="${iconWidth + labelWidth}" y1="1" x2="${iconWidth + labelWidth}" y2="${height - 1}" stroke="${borderColor}" stroke-width="1" vector-effect="non-scaling-stroke"/>
  </g>

  <!-- Platform Icon -->
  <svg x="${(iconWidth - 18) / 2}" y="${(height - 18) / 2}" width="18" height="18" viewBox="${iconViewBox}">
    ${icon}
  </svg>

  <g text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="500">
    <text x="${iconWidth + (labelWidth / 2)}" y="20 " fill="${labelTextColor}">${escapeXml(label)}</text>
    <text x="${iconWidth + labelWidth + (valueWidth / 2)}" y="21" font-size="16" font-weight="700" letter-spacing="-1" fill="${valueTextColor}">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
}
