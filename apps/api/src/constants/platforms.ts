import { ICONS } from './icons.js'

export const PLATFORMS = {
	MODRINTH: {
		id: 'modrinth',
		name: 'Modrinth',
		defaultColor: '#1bd96a',
		icon: (color) => ICONS.modrinth(color),
	},
	CURSEFORGE: {
		id: 'curseforge',
		name: 'CurseForge',
		defaultColor: '#F16436',
		icon: (color) => ICONS.curseforge(color),
	},
	HANGAR: {
		id: 'hangar',
		name: 'Hangar',
		defaultColor: '#3371ED',
		icon: (color) => ICONS.hangar(color),
	},
	SPIGOT: {
		id: 'spigot',
		name: 'Spigot',
		defaultColor: '#E8A838',
		icon: (color) => ICONS.spigotPlatform(color),
	},
}

export function getPlatform(platformId) {
	return Object.values(PLATFORMS).find((p) => p.id === platformId) || null
}
