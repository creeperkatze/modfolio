import { GenericModrinthClient } from '@modrinth/api-client'

import { callPlatform, getDefaultUserAgent } from '../errors.js'

const PLATFORM = 'Modrinth'

/**
 * Thin, typed wrapper around `@modrinth/api-client`. Every call is normalized
 * through `callPlatform`, so a 4xx resolves to `null` and a 5xx/network error
 * throws a `PlatformApiError`. No image, stats, or timing logic lives here — that
 * is the job of the assembly layer in `modrinthClient.ts`.
 */
class ModrinthApi {
	private client: GenericModrinthClient

	constructor() {
		this.client = new GenericModrinthClient({ userAgent: getDefaultUserAgent() })
	}

	getUser(username: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.users_v2.get(username))
	}

	getUserProjects(username: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.users_v2.getProjects(username))
	}

	getProjectV3(slug: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.projects_v3.get(slug))
	}

	getProjectVersions(slug: string) {
		return callPlatform(PLATFORM, () =>
			this.client.labrinth.versions_v3.getProjectVersions(slug, { include_changelog: false }),
		)
	}

	getOrganization(id: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.organizations_v3.get(id))
	}

	getOrganizationProjects(id: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.organizations_v3.getProjects(id))
	}

	getCollection(id: string) {
		return callPlatform(PLATFORM, () => this.client.labrinth.collections.get(id))
	}

	getProjects(ids: string[]) {
		return callPlatform(PLATFORM, () => this.client.labrinth.projects_v2.getMultiple(ids))
	}
}

export const modrinthApi = new ModrinthApi()
