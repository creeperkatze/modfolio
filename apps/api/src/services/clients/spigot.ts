import SpigetClient from 'spiget-js'

import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'Spigot'
const SPIGET_API_URL = 'https://api.spiget.org/v2'

/**
 * Direct SpigotMC icon URL. `Resource.icon.data` / `Author.icon.data` already carry
 * base64 icon data inline on almost every response, so these builders only serve as
 * a last-resort fallback for the rare entity where Spiget itself has no icon data.
 */
export const resourceIconFallbackUrl = (resourceId: number | string) =>
	`https://www.spigotmc.org/data/resource_icons/${Math.floor(Number(resourceId) / 1000)}/${resourceId}.jpg`

/** Spiget's per-author avatar endpoint, used as a fallback when `Author.icon.data` is empty. */
export const authorAvatarUrl = (authorId: number | string) =>
	`${SPIGET_API_URL}/authors/${authorId}/avatar`

/** Thin wrapper around `spiget-js`. */
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
