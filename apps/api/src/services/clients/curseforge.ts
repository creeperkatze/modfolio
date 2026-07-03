import CurseForgeClient, { GameId, ModsSearchSortField } from 'curseforge-js'

import { CURSEFORGE_API_KEY } from '../../config/env.js'
import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'CurseForge'

// Known loader names (for detecting loaders in a file's gameVersions array).
const KNOWN_LOADERS = [
	'Forge',
	'Fabric',
	'NeoForge',
	'Quilt',
	'Rift',
	'LiteLoader',
	'Cauldron',
	'ModLoader',
	'Canvas',
	'Iris',
	'OptiFine',
	'Sodium',
]

// Tags that appear in gameVersions but are not actual game versions.
const FILTERED_TAGS = ['Client', 'Server', 'Singleplayer', 'Java']

// CurseForge gameVersionTypeId -> loader name (for loaders only exposed via sortableGameVersions).
const GAME_VERSION_TYPE_IDS: Record<number, string> = {
	68441: 'NeoForge',
}

/** Extract the deduplicated loader list from a CurseForge file object. */
export function extractLoaders(file: any): string[] {
	const fromTypeId = (file.sortableGameVersions || [])
		.map((v) => GAME_VERSION_TYPE_IDS[v.gameVersionTypeId])
		.filter(Boolean)
	const fromGameVersions = (file.gameVersions || []).filter((v) => KNOWN_LOADERS.includes(v))
	return [...new Set([...fromTypeId, ...fromGameVersions])]
}

/** Extract only the real Minecraft versions from a file's gameVersions (loaders/tags removed). */
export function extractGameVersions(file: any): string[] {
	return (file.gameVersions || []).filter(
		(v) => !KNOWN_LOADERS.includes(v) && !FILTERED_TAGS.includes(v),
	)
}

type SearchOptions = {
	authorId?: number
	searchFilter?: string
	slug?: string
	classId?: number
	pageSize?: number
	sortField?: (typeof ModsSearchSortField)[keyof typeof ModsSearchSortField]
	sortOrder?: 'asc' | 'desc'
}

/**
 * Thin wrapper around `curseforge-js`. CurseForge has no user/project-listing
 * endpoints, so "a user's projects" is modelled through the mod search API; the
 * search-shaped lookups live here while the mapping to card/badge shapes lives in
 * the assembly layer.
 */
class CurseforgeApi {
	private client: CurseForgeClient

	constructor() {
		this.client = new CurseForgeClient({
			apiKey: CURSEFORGE_API_KEY,
			userAgent: getDefaultUserAgent(),
		})
	}

	getMod(modId: number | string) {
		return callPlatform(PLATFORM, () => this.client.mods.get(Number(modId)))
	}

	getModFiles(modId: number | string, pageSize: number) {
		return callPlatform(PLATFORM, () => this.client.files.list(Number(modId), { pageSize }))
	}

	getUser(userId: number | string) {
		return callPlatform(PLATFORM, () => this.client.users.get(Number(userId)))
	}

	/** Raw Minecraft mod search. Not wrapped in `callPlatform`: callers depend on the thrown error. */
	searchMods(options: SearchOptions) {
		return this.client.mods.search({ gameId: GameId.Minecraft, ...(options as any) })
	}

	async searchModBySlug(slug: string): Promise<number> {
		const response = await this.searchMods({ slug })
		const data = response.data
		if (!data || data.length === 0) {
			throw new Error(`Mod not found: ${slug}`)
		}
		return data[0].id
	}

	async getUserIdFromUsername(username: string): Promise<string> {
		const response = await this.searchMods({
			searchFilter: username,
			pageSize: 50,
			sortField: ModsSearchSortField.Popularity,
			sortOrder: 'desc',
		})
		const results = response.data || []

		const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')
		const target = username.toLowerCase()

		// Prefer an exact author-name match, then fall back to a normalized match.
		for (const matcher of [
			(name: string) => name.toLowerCase() === target,
			(name: string) => name.toLowerCase() === target || normalize(name) === normalize(username),
		]) {
			for (const mod of results) {
				const author = (mod.authors || []).find((a) => a.name && matcher(a.name))
				if (author?.id) return String(author.id)
			}
		}

		throw new Error('User not found')
	}

	async getUsernameFromUserId(userId: string | number): Promise<string | null> {
		const response = await this.searchMods({ authorId: Number(userId), pageSize: 1 })
		const results = response.data || []
		const author = results[0]?.authors?.find((a) => String(a.id) === String(userId))
		return author?.name || null
	}
}

export const curseforgeApi = new CurseforgeApi()
export { ModsSearchSortField }
