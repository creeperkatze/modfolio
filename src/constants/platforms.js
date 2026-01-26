import { ICONS } from "./icons.js";

/**
 * Platform configuration constants.
 * Centralizes platform-specific branding and default styling.
 */
export const PLATFORMS = {
    MODRINTH: {
        id: "modrinth",
        name: "Modrinth",
        defaultColor: "#1bd96a",
        icon: (color) => ICONS.modrinth(color)
    },
    CURSEFORGE: {
        id: "curseforge",
        name: "CurseForge",
        defaultColor: "#F16436",
        icon: (color) => ICONS.curseforge(color)
    },
    HANGAR: {
        id: "hangar",
        name: "Hangar",
        defaultColor: "#3371ED",
        icon: (color) => ICONS.hangar(color)
    }
};

/**
 * Get platform configuration by ID.
 *
 * @param {string} platformId - The platform ID (modrinth, curseforge)
 * @returns {Object|null} The platform configuration or null if not found
 */
export function getPlatform(platformId) {
    return Object.values(PLATFORMS).find(p => p.id === platformId) || null;
}
