import SpigetClient from 'spiget-js'

import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'Spigot'
const SPIGET_API_URL = 'https://api.spiget.org/v2'

// Fallback only: icon.data is usually inline already; this covers the rare entity with none.
export const resourceIconFallbackUrl = (resourceId: number | string) =>
	`https://www.spigotmc.org/data/resource_icons/${Math.floor(Number(resourceId) / 1000)}/${resourceId}.jpg`

// Fallback for when Author.icon.data is empty.
export const authorAvatarUrl = (authorId: number | string) =>
	`${SPIGET_API_URL}/authors/${authorId}/avatar`

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
