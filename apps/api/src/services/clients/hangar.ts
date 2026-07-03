import HangarClient from 'hangarmc-js'

import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'Hangar'

/**
 * Thin wrapper around `hangarmc-js`. Hangar addresses projects by `owner/slug`,
 * but every public route only knows the slug, so this layer owns resolving a slug
 * to its owner (and caching that mapping). Everything above the raw library calls
 * — sorting, stats, images — belongs to the assembly layer.
 */
class HangarApi {
	private client: HangarClient
	private namespaceCache = new Map<string, string>()

	constructor() {
		this.client = new HangarClient({ userAgent: getDefaultUserAgent() })
	}

	private async resolveOwner(slug: string): Promise<string | null> {
		if (this.namespaceCache.has(slug)) {
			return this.namespaceCache.get(slug)
		}

		const results = await this.client.projects.list({ query: slug, limit: 5 })
		const match = results.result.find((p) => p.namespace.slug.toLowerCase() === slug.toLowerCase())
		if (!match) {
			return null
		}

		this.namespaceCache.set(slug, match.namespace.owner)
		return match.namespace.owner
	}

	getProject(slug: string) {
		return callPlatform(PLATFORM, async () => {
			const owner = await this.resolveOwner(slug)
			if (!owner) return null
			return this.client.projects.get(owner, slug)
		})
	}

	getProjectVersions(slug: string, limit = 10) {
		return callPlatform(PLATFORM, async () => {
			const owner = await this.resolveOwner(slug)
			if (!owner) return null
			return this.client.versions.list(owner, slug, { limit })
		})
	}

	getUser(username: string) {
		return callPlatform(PLATFORM, () => this.client.users.get(username))
	}

	getUserProjects(username: string, limit = 25) {
		return callPlatform(PLATFORM, () => this.client.projects.list({ owner: username, limit }))
	}
}

export const hangarApi = new HangarApi()
