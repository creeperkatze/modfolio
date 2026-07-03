import { CARD_LIMITS } from '../../constants/platformConfig.js'
import {
	enrichImage,
	fetchImagesForProjects,
	fetchVersionDatesForProjects,
} from '../../utils/image.js'
import logger from '../../utils/logger.js'
import { hangarApi } from '../clients/hangar.js'
import { startTimer } from '../timing.js'

const sumStat = (projects, field) => projects.reduce((sum, p) => sum + (p?.stats?.[field] || 0), 0)

// Assembles hangarApi reads (owner-resolved) with image/sparkline/stat enrichment into card/badge payloads.
export class HangarPlatform {
	getProject = hangarApi.getProject.bind(hangarApi)
	getProjectVersions = hangarApi.getProjectVersions.bind(hangarApi)
	getUser = hangarApi.getUser.bind(hangarApi)
	getUserProjects = hangarApi.getUserProjects.bind(hangarApi)

	async getProjectStats(projectSlug, convertToPng = false) {
		const elapsed = startTimer()

		const project = await this.getProject(projectSlug)
		if (!project) return null

		const imageConversionTime = await enrichImage(
			project,
			project.avatarUrl,
			'icon_url_base64',
			convertToPng,
		)

		// Always fetch max for caching; the card generator slices to maxVersions.
		let versions = []
		let totalVersionCount = 0
		try {
			const versionsResponse = await this.getProjectVersions(projectSlug, CARD_LIMITS.MAX_COUNT)
			const allVersions = versionsResponse?.result || []
			totalVersionCount = versionsResponse?.pagination?.count ?? allVersions.length

			versions = allVersions
				.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
				.map((version) => {
					// Collect every unique Minecraft version across platform dependencies.
					const gameVersions = new Set<string>()
					Object.values(version.platformDependencies || {}).forEach((list: string[]) =>
						list.forEach((v) => gameVersions.add(v)),
					)

					return {
						name: version.name,
						version: version.name,
						createdAt: version.createdAt,
						releasedAt: version.createdAt,
						description: version.description,
						downloads: version?.stats?.totalDownloads || 0,
						platforms: Object.keys(version.downloads || {}),
						gameVersions: Array.from(gameVersions),
						channel: version.channel?.name || 'Release',
					}
				})
		} catch {
			// Leave versions empty if the fetch fails.
		}

		return {
			project,
			versions,
			stats: {
				downloads: project?.stats?.downloads || 0,
				stars: project?.stats?.stars || 0,
				versionCount: totalVersionCount,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getProjectBadgeStats(projectSlug) {
		const elapsed = startTimer()

		const project = await this.getProject(projectSlug)
		if (!project) return null

		const stats = {
			downloads: project?.stats?.downloads || 0,
			views: project?.stats?.views || 0,
			versionCount: 0,
		}

		try {
			const versionsResponse = await this.getProjectVersions(projectSlug)
			stats.versionCount =
				versionsResponse?.pagination?.count ?? versionsResponse?.result?.length ?? 0
		} catch {
			stats.versionCount = 0
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getUserStats(username, convertToPng = false) {
		const elapsed = startTimer()

		const user = await this.getUser(username)
		if (!user) return null

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(
			user,
			user.avatarUrl,
			'avatar_url_base64',
			convertToPng,
		)

		let projects = []
		let totalDownloads = 0
		let totalStars = 0
		let allVersionDates = []

		try {
			const projectsResponse = await this.getUserProjects(username, 50) // Fetch extra for sorting.
			const allProjects = projectsResponse?.result || []

			projects = allProjects
				.sort((a, b) => (b?.stats?.downloads || 0) - (a?.stats?.downloads || 0))
				.slice(0, CARD_LIMITS.MAX_COUNT)
				.map((project) => ({
					slug: project.namespace?.slug,
					id: project.namespace?.slug, // Used by fetchVersionDatesForProjects.
					name: project.name,
					description: project.description,
					downloads: project?.stats?.downloads || 0,
					views: project?.stats?.views || 0,
					stars: project?.stats?.stars || 0,
					category: project.category,
					createdAt: project.createdAt,
					lastUpdated: project.lastUpdated,
					icon_url: project.avatarUrl || null, // Normalized for fetchImagesForProjects.
				}))

			totalDownloads = sumStat(allProjects, 'downloads')
			totalStars = sumStat(allProjects, 'stars')

			imageConversionTime += await fetchImagesForProjects(projects, convertToPng)

			try {
				await fetchVersionDatesForProjects(projects, async (slug) => {
					const versionsResponse = await this.getProjectVersions(slug, 10)
					return (versionsResponse?.result || []).map((v) => ({ date_published: v.createdAt }))
				})
				allVersionDates = projects.flatMap((p) => p.versionDates || [])
			} catch (err) {
				logger.warn(
					{ err, platform: 'hangar', entity: 'user', username },
					'Error fetching version dates',
				)
				allVersionDates = []
			}
		} catch {
			// Leave projects empty if the fetch fails.
		}

		return {
			user,
			projects,
			stats: {
				totalDownloads,
				totalStars,
				projectCount: user?.projectCount || projects.length,
				allVersionDates,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getUserBadgeStats(username) {
		const elapsed = startTimer()

		const user = await this.getUser(username)
		if (!user) return null

		let totalDownloads = 0
		let totalStars = 0
		let projectCount = user?.projectCount || 0

		try {
			const projectsResponse = await this.getUserProjects(username, 100)
			const allProjects = projectsResponse?.result || []
			totalDownloads = sumStat(allProjects, 'downloads')
			totalStars = sumStat(allProjects, 'stars')
			projectCount = projectsResponse?.pagination?.count ?? allProjects.length
		} catch {
			// Fall back to the projectCount from the user record.
		}

		return { stats: { totalDownloads, projectCount, totalStars }, timings: { api: elapsed() } }
	}
}

export default new HangarPlatform()
