export const CARD_LIMITS = {
	DEFAULT_COUNT: 5,
	MAX_COUNT: 10,
}

export const MODRINTH_PROJECT_TYPE_SEGMENTS = {
	mods: 'mod',
	modpacks: 'modpack',
	resourcepacks: 'resourcepack',
	shaders: 'shader',
	datapacks: 'datapack',
	plugins: 'plugin',
}

export const PLATFORMS = {
	modrinth: {
		id: 'modrinth',
		name: 'Modrinth',
		defaultColor: '1bd96a',
		baseUrl: 'modrinth.com',
		projectPath: 'mod',
		targets: ['user', 'project', 'organization', 'collection', 'server'],
		badgeMetrics: {
			user: ['downloads', 'followers', 'projects'],
			project: ['downloads', 'followers', 'versions'],
			organization: ['downloads', 'followers', 'projects'],
			collection: ['downloads', 'followers', 'projects'],
			server: ['followers', 'players'],
		},
		projectTypeOptions: [
			{ value: '', label: 'All Types' },
			{ value: 'mod', label: 'Mods' },
			{ value: 'modpack', label: 'Modpacks' },
			{ value: 'resourcepack', label: 'Resource Packs' },
			{ value: 'shader', label: 'Shaders' },
			{ value: 'datapack', label: 'Data Packs' },
			{ value: 'plugin', label: 'Plugins' },
		],
	},
	curseforge: {
		id: 'curseforge',
		name: 'CurseForge',
		defaultColor: 'F16436',
		baseUrl: 'curseforge.com',
		projectPath: 'minecraft/mc-mods',
		userPath: 'members',
		targets: ['user', 'project'],
		badgeMetrics: {
			project: ['downloads', 'rank', 'versions'],
			user: ['downloads', 'projects', 'followers'],
		},
		projectTypeOptions: [
			{ value: '', label: 'All Types' },
			{ value: '6', label: 'Mods' },
			{ value: '4471', label: 'Modpacks' },
			{ value: '12', label: 'Texture Packs' },
			{ value: '6552', label: 'Shaders' },
			{ value: '4546', label: 'Bukkit Plugins' },
		],
	},
	hangar: {
		id: 'hangar',
		name: 'Hangar',
		defaultColor: '3371ED',
		baseUrl: 'hangar.papermc.io',
		projectPath: 'plugins',
		targets: ['user', 'project'],
		badgeMetrics: {
			user: ['downloads', 'projects', 'stars'],
			project: ['downloads', 'versions', 'views'],
		},
	},
	spigot: {
		id: 'spigot',
		name: 'Spigot',
		defaultColor: 'E8A838',
		baseUrl: 'spigotmc.org',
		projectPath: 'resources',
		targets: ['author', 'resource'],
		badgeMetrics: {
			author: ['downloads', 'resources', 'rating'],
			resource: ['downloads', 'likes', 'rating', 'versions'],
		},
	},
}

export const METRIC_LABELS = {
	downloads: 'Downloads',
	followers: 'Followers',
	projects: 'Projects',
	rank: 'Rank',
	stars: 'Stars',
	versions: 'Versions',
	views: 'Views',
	likes: 'Likes',
	resources: 'Resources',
	rating: 'Rating',
	players: 'Players Online',
}

export function hslToHex(h) {
	const s = 1,
		l = 0.75
	const c = (1 - Math.abs(2 * l - 1)) * s
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
	const m = l - c / 2
	let r, g, b

	if (h < 60) {
		r = c
		g = x
		b = 0
	} else if (h < 120) {
		r = x
		g = c
		b = 0
	} else if (h < 180) {
		r = 0
		g = c
		b = x
	} else if (h < 240) {
		r = 0
		g = x
		b = c
	} else if (h < 300) {
		r = x
		g = 0
		b = c
	} else {
		r = c
		g = 0
		b = x
	}

	const toHex = (val) =>
		Math.round((val + m) * 255)
			.toString(16)
			.padStart(2, '0')
	return toHex(r) + toHex(g) + toHex(b)
}

export function getAccentColors(platformId) {
	return [
		PLATFORMS[platformId].defaultColor,
		...[0, 30, 60, 150, 180, 210, 240, 270, 330].map(hslToHex),
	]
}

export const BG_COLORS = [
	{ name: 'transparent', value: null },
	{ name: 'white', value: 'ffffff' },
	{ name: 'github-dark', value: '0d1117' },
]

export function parseUrl(urlString) {
	try {
		const urlObj = new URL(urlString)
		const platform = Object.values(PLATFORMS).find((p) => urlObj.hostname.includes(p.baseUrl))
		if (!platform) return null

		const pathParts = urlObj.pathname.split('/').filter((p) => p)

		if (platform.id === 'curseforge') {
			if (pathParts.length < 2) return null
			if (pathParts[0] === 'members' && pathParts[1]) {
				const classId = urlObj.searchParams.get('classIds') || null
				return {
					platform: platform.id,
					type: 'user',
					id: pathParts[1],
					isCurseForge: true,
					needsId: true,
					classId,
				}
			}
			if (pathParts.length >= 3) {
				return {
					platform: platform.id,
					type: 'project',
					id: pathParts[2],
					slug: pathParts[2],
					isCurseForge: true,
				}
			}
			return null
		}

		if (platform.id === 'hangar') {
			if (pathParts.length < 1) return null
			if (pathParts[0] === 'plugins' && pathParts[1]) {
				return { platform: platform.id, type: 'project', id: pathParts[1], slug: pathParts[1] }
			}
			if (pathParts[1]) {
				return { platform: platform.id, type: 'project', id: pathParts[1], slug: pathParts[1] }
			}
			return { platform: platform.id, type: 'user', id: pathParts[0] }
		}

		if (platform.id === 'spigot') {
			if (pathParts.length < 2) return null
			if (pathParts[0] === 'resources' && pathParts[1] === 'authors' && pathParts[2]) {
				const match = pathParts[2].match(/\.(\d+)$/)
				if (match) return { platform: platform.id, type: 'author', id: match[1] }
				if (/^\d+$/.test(pathParts[2]))
					return { platform: platform.id, type: 'author', id: pathParts[2] }
			} else if (pathParts[0] === 'resources' && pathParts[1]) {
				const match = pathParts[1].match(/\.(\d+)$/)
				if (match) return { platform: platform.id, type: 'resource', id: match[1] }
				if (/^\d+$/.test(pathParts[1]))
					return { platform: platform.id, type: 'resource', id: pathParts[1] }
			}
			return null
		}

		// Modrinth
		if (pathParts.length < 2) return null
		const typeMap = {
			project: 'project',
			mod: 'project',
			modpack: 'project',
			shader: 'project',
			resourcepack: 'project',
			datapack: 'project',
			plugin: 'project',
			server: 'server',
			user: 'user',
			organization: 'organization',
			collection: 'collection',
		}
		const mappedType = typeMap[pathParts[0]]
		if (!mappedType) return null
		// Check for optional project type filter segment: /user/name/mods or /organization/slug/resourcepacks
		const projectType = pathParts[2] ? MODRINTH_PROJECT_TYPE_SEGMENTS[pathParts[2]] || null : null
		return { platform: platform.id, type: mappedType, id: pathParts[1], projectType }
	} catch {
		return null
	}
}
