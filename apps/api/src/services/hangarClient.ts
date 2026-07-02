import dotenv from 'dotenv'
import HangarClient from 'hangarmc-js'
import { performance } from 'perf_hooks'

import { CARD_LIMITS } from '../constants/platformConfig.js'
import {
	fetchImageAsBase64,
	fetchImagesForProjects,
	fetchVersionDatesForProjects,
} from '../utils/imageFetcher.js'
import logger from '../utils/logger.js'
import { callPlatform, getDefaultUserAgent } from './baseClient.js'

dotenv.config({ quiet: true })

const HANGAR_API_URL = process.env.HANGAR_API_URL || 'https://hangar.papermc.io'
const HANGAR_API_KEY = process.env.HANGAR_API_KEY

export class HangarClientWrapper {
	private client: HangarClient
	// hangarmc-js requires an {owner, slug} pair to look up a project, but modfolio's
	// routes only carry the slug - cache slug -> owner resolutions to avoid re-searching.
	private namespaceCache = new Map<string, string>()

	constructor() {
		this.client = new HangarClient({
			baseUrl: HANGAR_API_URL,
			apiKey: HANGAR_API_KEY,
			userAgent: getDefaultUserAgent(),
		})
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

	async getProject(projectSlug) {
		return callPlatform('Hangar', async () => {
			const owner = await this.resolveOwner(projectSlug)
			if (!owner) return null
			return this.client.projects.get(owner, projectSlug)
		})
	}

	async getProjectVersions(projectSlug, limit = 10) {
		return callPlatform('Hangar', async () => {
			const owner = await this.resolveOwner(projectSlug)
			if (!owner) return null
			return this.client.versions.list(owner, projectSlug, { limit })
		})
	}

	async getProjectStats(projectSlug, convertToPng = false) {
		const apiStart = performance.now()

		const project = await this.getProject(projectSlug)
		if (!project) {
			return null // Return null instead of throwing to avoid stack trace
		}

		let imageConversionTime = 0

		if (project.avatarUrl) {
			const result = await fetchImageAsBase64(project.avatarUrl, convertToPng)
			project['icon_url_base64'] = result?.data
			if (result?.conversionTime) imageConversionTime += result.conversionTime
		}

		// Fetch versions for the project
		let versions = []
		let totalVersionCount = 0
		try {
			// Always fetch max for caching (card generator slices to maxVersions)
			const versionsResponse = await this.getProjectVersions(projectSlug, CARD_LIMITS.MAX_COUNT)
			const allVersions = versionsResponse?.result || []
			totalVersionCount = versionsResponse?.pagination?.count ?? allVersions.length

			// Sort by date (newest first)
			versions = allVersions
				.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
				.map((version) => {
					// Extract platform data from downloads keys (Paper, Velocity, Waterfall, etc.)
					const platforms = Object.keys(version.downloads || {})

					// Get version download count from stats.totalDownloads
					const downloads = version?.stats?.totalDownloads || 0

					// Extract all unique Minecraft versions from platformDependencies
					const gameVersions = new Set<string>()
					if (version.platformDependencies) {
						Object.values(version.platformDependencies).forEach((versionList: string[]) => {
							versionList.forEach((v) => gameVersions.add(v))
						})
					}

					return {
						name: version.name,
						version: version.name,
						createdAt: version.createdAt,
						releasedAt: version.createdAt,
						description: version.description,
						downloads: downloads,
						platforms: platforms,
						gameVersions: Array.from(gameVersions),
						channel: version.channel?.name || 'Release',
					}
				})
		} catch {
			// If versions fetch fails, continue with empty versions array
		}

		const apiTime = performance.now() - apiStart

		// Get stats from project
		const stats = {
			downloads: project?.stats?.downloads || 0,
			stars: project?.stats?.stars || 0,
			versionCount: totalVersionCount,
		}

		return {
			project,
			versions,
			stats,
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getProjectBadgeStats(projectSlug) {
		const apiStart = performance.now()

		const project = await this.getProject(projectSlug)
		if (!project) {
			return null
		}

		const stats = {
			downloads: project?.stats?.downloads || 0,
			views: project?.stats?.views || 0,
			versionCount: 0,
		}

		// Fetch versions
		try {
			const versionsResponse = await this.getProjectVersions(projectSlug)
			stats.versionCount = versionsResponse?.pagination?.count ?? versionsResponse?.result?.length ?? 0
		} catch {
			stats.versionCount = 0
		}

		const apiTime = performance.now() - apiStart
		return { stats, timings: { api: apiTime } }
	}

	async getUser(username) {
		return callPlatform('Hangar', () => this.client.users.get(username))
	}

	async getUserProjects(username, limit = 25) {
		return callPlatform('Hangar', () => this.client.projects.list({ owner: username, limit }))
	}

	async getUserStats(username, convertToPng = false) {
		const apiStart = performance.now()

		const user = await this.getUser(username)
		if (!user) {
			return null // Return null instead of throwing to avoid stack trace
		}

		let imageConversionTime = 0

		// Fetch user avatar if available
		if (user.avatarUrl) {
			const result = await fetchImageAsBase64(user.avatarUrl, convertToPng)
			user['avatar_url_base64'] = result?.data
			if (result?.conversionTime) imageConversionTime += result.conversionTime
		}

		// Fetch user's projects
		let projects = []
		let totalDownloads = 0
		let totalStars = 0
		let allVersionDates = []

		try {
			const projectsResponse = await this.getUserProjects(username, 50) // Fetch more for sorting
			const allProjects = projectsResponse?.result || []

			// Sort by downloads and take max (for caching, card generator slices to maxProjects)
			projects = allProjects
				.sort((a, b) => (b?.stats?.downloads || 0) - (a?.stats?.downloads || 0))
				.slice(0, CARD_LIMITS.MAX_COUNT)
				.map((project) => ({
					slug: project.namespace?.slug,
					id: project.namespace?.slug, // For fetchVersionDatesForProjects
					name: project.name,
					description: project.description,
					downloads: project?.stats?.downloads || 0,
					views: project?.stats?.views || 0,
					stars: project?.stats?.stars || 0,
					category: project.category,
					createdAt: project.createdAt,
					lastUpdated: project.lastUpdated,
					// Normalize icon_url for fetchImagesForProjects utility
					icon_url: project.avatarUrl || null,
				}))

			// Calculate total downloads across all user's projects
			totalDownloads = allProjects.reduce((sum, p) => sum + (p?.stats?.downloads || 0), 0)
			totalStars = allProjects.reduce((sum, p) => sum + (p?.stats?.stars || 0), 0)

			// Use reusable utilities for image fetching and version dates
			const projectsConversionTime = await fetchImagesForProjects(projects, convertToPng)
			imageConversionTime += projectsConversionTime

			// Custom version fetcher that transforms Hangar versions to match expected format
			const getVersionsForSparkline = async (slug) => {
				const versionsResponse = await this.getProjectVersions(slug, 10)
				const versions = versionsResponse?.result || []
				// Transform Hangar versions to match Modrinth format (date_published)
				return versions.map((v) => ({
					date_published: v.createdAt,
				}))
			}

			try {
				await fetchVersionDatesForProjects(projects, getVersionsForSparkline)
				allVersionDates = projects.flatMap((p) => p.versionDates || [])
			} catch (err) {
				logger.warn(
					{
						err,
						platform: 'hangar',
						entity: 'user',
						username,
					},
					'Error fetching version dates',
				)
				allVersionDates = []
			}
		} catch {
			// If projects fetch fails, continue with empty projects array
		}

		const apiTime = performance.now() - apiStart

		const stats = {
			totalDownloads,
			totalStars,
			projectCount: user?.projectCount || projects.length,
			allVersionDates,
		}

		return {
			user,
			projects,
			stats,
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getUserBadgeStats(username) {
		const apiStart = performance.now()

		const user = await this.getUser(username)
		if (!user) {
			return null
		}

		let totalDownloads = 0
		let totalStars = 0
		let projectCount = user?.projectCount || 0

		// Fetch all user's projects for download count and stars
		try {
			const projectsResponse = await this.getUserProjects(username, 100)
			const allProjects = projectsResponse?.result || []
			totalDownloads = allProjects.reduce((sum, p) => sum + (p?.stats?.downloads || 0), 0)
			totalStars = allProjects.reduce((sum, p) => sum + (p?.stats?.stars || 0), 0)
			projectCount = projectsResponse?.pagination?.count ?? allProjects.length
		} catch {
			// Use projectCount from user data if fetch fails
		}

		const apiTime = performance.now() - apiStart

		const stats = {
			totalDownloads,
			projectCount,
			totalStars,
		}

		return { stats, timings: { api: apiTime } }
	}

	isConfigured() {
		return !!HANGAR_API_KEY
	}
}

export default new HangarClientWrapper()
