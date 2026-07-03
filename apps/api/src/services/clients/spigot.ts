import SpigetClient from 'spiget-js'

import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'Spigot'
const SPIGET_API_URL = 'https://api.spiget.org/v2'

/** Spiget's per-resource icon endpoint. Returns 404 for some resources that do have icons on SpigotMC. */
export const resourceIconUrl = (resourceId: number | string) =>
	`${SPIGET_API_URL}/resources/${resourceId}/icon`

/** Direct SpigotMC icon URL, used as a fallback when the Spiget icon endpoint 404s. */
export const resourceIconFallbackUrl = (resourceId: number | string) =>
	`https://www.spigotmc.org/data/resource_icons/${Math.floor(Number(resourceId) / 1000)}/${resourceId}.jpg`

/** Spiget's per-author avatar endpoint. */
export const authorAvatarUrl = (authorId: number | string) =>
	`${SPIGET_API_URL}/authors/${authorId}/avatar`

/**
 * Thin wrapper around `spiget-js`. Spiget serves icons/avatars from separate
 * endpoints rather than fields on the entity, so the URL builders above are
 * exported for the assembly layer to enrich with.
 */
class SpigotApi {
	private client: SpigetClient

	constructor() {
		this.client = new SpigetClient({ userAgent: getDefaultUserAgent() })
	}

	getResource(resourceId: number | string) {
		return callPlatform(PLATFORM, () => this.client.resources.get(Number(resourceId)))
	}

	getResourceVersions(resourceId: number | string, limit = 10) {
		return callPlatform(PLATFORM, () =>
			this.client.resources.getVersions(Number(resourceId), { size: limit, sort: '-releaseDate' }),
		)
	}

	getAuthor(authorId: number | string) {
		return callPlatform(PLATFORM, () => this.client.authors.get(Number(authorId)))
	}

	getAuthorResources(authorId: number | string, limit = 25) {
		return callPlatform(PLATFORM, () =>
			this.client.authors.getResources(Number(authorId), { size: limit, sort: '-downloads' }),
		)
	}
}

export const spigotApi = new SpigotApi()
