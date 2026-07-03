import { CARD_LIMITS } from '../../constants/platformConfig.js'
import {
	enrichImage,
	fetchImagesForProjects,
	fetchVersionDatesForProjects,
} from '../../utils/image.js'
import {
	aggregateAllStats,
	aggregateProjectStats,
	normalizeV3ProjectFields,
} from '../../utils/statsAggregator.js'
import { modrinthApi } from '../clients/modrinth.js'
import { startTimer } from '../timing.js'

const isServerProjectType = (type) =>
	type === 'minecraft_java_server' || type === 'minecraft_bedrock_server'

const sumField = (items, field) => items.reduce((sum, item) => sum + (item[field] || 0), 0)

// Assembles modrinthApi reads with image/stats/sparkline enrichment into card/badge payloads.
export class ModrinthPlatform {
	// Delegates straight to the client layer; also used internally for sparkline version dates.
	getUser = modrinthApi.getUser.bind(modrinthApi)
	getUserProjects = modrinthApi.getUserProjects.bind(modrinthApi)
	getProjectV3 = modrinthApi.getProjectV3.bind(modrinthApi)
	getProjectVersions = modrinthApi.getProjectVersions.bind(modrinthApi)
	getOrganization = modrinthApi.getOrganization.bind(modrinthApi)
	getOrganizationProjects = modrinthApi.getOrganizationProjects.bind(modrinthApi)
	getCollection = modrinthApi.getCollection.bind(modrinthApi)
	getProjects = modrinthApi.getProjects.bind(modrinthApi)

	async getUserStats(username, convertToPng = false, projectType = null) {
		const elapsed = startTimer()

		const [user, allProjects] = await Promise.all([
			this.getUser(username),
			this.getUserProjects(username),
		])
		if (!user) return null

		const apiTime = elapsed()

		const projects = projectType
			? allProjects.filter((p) => p.project_type === projectType)
			: allProjects

		const stats = aggregateAllStats(projects, CARD_LIMITS.MAX_COUNT)
		const topProjects = stats.topProjects

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(
			user,
			user.avatar_url,
			'avatar_url_base64',
			convertToPng,
		)
		imageConversionTime += await fetchImagesForProjects(topProjects, convertToPng)

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions)
		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			user,
			projects,
			stats: { ...stats, allVersionDates },
			timings: { api: apiTime, imageConversion: imageConversionTime },
		}
	}

	async getProjectStats(slug, convertToPng = false) {
		const elapsed = startTimer()

		const [project, versions] = await Promise.all([
			this.getProjectV3(slug),
			this.getProjectVersions(slug),
		])
		if (!project) return null

		const isServer = (project.project_types || []).some(isServerProjectType)
		const apiTime = elapsed()

		const imageConversionTime = await enrichImage(
			project,
			project.icon_url,
			'icon_url_base64',
			convertToPng,
		)

		const latestVersions = [...versions]
			.sort((a, b) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime())
			.slice(0, CARD_LIMITS.MAX_COUNT)

		let stats
		if (isServer) {
			const javaServer = project.minecraft_java_server
			stats = {
				playersOnline: javaServer?.ping?.data?.players_online ?? null,
				verifiedPlays2w: javaServer?.verified_plays_2w ?? null,
				downloads: project.downloads || 0,
			}
		} else {
			stats = {
				downloads: project.downloads || 0,
				followers: project.followers || 0,
				versionCount: versions.length,
			}
		}

		return {
			project,
			versions: isServer ? [] : latestVersions,
			stats,
			entityType: isServer ? 'server' : undefined,
			timings: { api: apiTime, imageConversion: imageConversionTime },
		}
	}

	async getOrganizationStats(id, convertToPng = false, projectType = null) {
		const elapsed = startTimer()

		const [organization, rawProjects] = await Promise.all([
			this.getOrganization(id),
			this.getOrganizationProjects(id),
		])
		if (!organization) return null

		const apiTime = elapsed()

		const allProjects = normalizeV3ProjectFields(rawProjects)
		const projects = projectType
			? allProjects.filter((p) => p.project_type === projectType)
			: allProjects

		const stats = aggregateAllStats(projects, CARD_LIMITS.MAX_COUNT)
		const topProjects = stats.topProjects

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(
			organization,
			organization.icon_url,
			'icon_url_base64',
			convertToPng,
		)
		imageConversionTime += await fetchImagesForProjects(topProjects, convertToPng)

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions)
		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			organization,
			projects,
			stats: { ...stats, allVersionDates },
			timings: { api: apiTime, imageConversion: imageConversionTime },
		}
	}

	async getCollectionStats(id, convertToPng = false) {
		const elapsed = startTimer()

		const collection = await this.getCollection(id)
		if (!collection) return null

		const projects = collection.projects?.length ? await this.getProjects(collection.projects) : []
		const apiTime = elapsed()

		const { totalDownloads, totalFollowers, projectCount, topProjects } = aggregateProjectStats(
			projects,
			CARD_LIMITS.MAX_COUNT,
		)

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(
			collection,
			collection.icon_url,
			'icon_url_base64',
			convertToPng,
		)
		imageConversionTime += await fetchImagesForProjects(topProjects, convertToPng)

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions)
		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			collection,
			projects,
			stats: { totalDownloads, totalFollowers, projectCount, topProjects, allVersionDates },
			timings: { api: apiTime, imageConversion: imageConversionTime },
		}
	}

	async getUserBadgeStats(username) {
		const elapsed = startTimer()

		const [user, projects] = await Promise.all([
			this.getUser(username),
			this.getUserProjects(username),
		])
		if (!user) return null

		const stats = {
			totalDownloads: sumField(projects, 'downloads'),
			totalFollowers: sumField(projects, 'followers'),
			projectCount: projects.length,
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getProjectBadgeStats(slug) {
		const elapsed = startTimer()

		const project = await this.getProjectV3(slug)
		if (!project) return null

		const stats = {
			downloads: project.downloads || 0,
			followers: project.followers || 0,
			versionCount: 0,
		}

		try {
			const versions = await this.getProjectVersions(slug)
			stats.versionCount = versions.length
		} catch {
			stats.versionCount = 0
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getServerBadgeStats(slug) {
		const elapsed = startTimer()

		const project = await this.getProjectV3(slug)
		if (!project) return null

		const javaServer = project.minecraft_java_server
		const stats = {
			followers: project.followers || 0,
			playersOnline: javaServer?.ping?.data?.players_online ?? null,
			verifiedPlays2w: javaServer?.verified_plays_2w ?? null,
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getOrganizationBadgeStats(id) {
		const elapsed = startTimer()

		const [organization, rawProjects] = await Promise.all([
			this.getOrganization(id),
			this.getOrganizationProjects(id),
		])
		if (!organization) return null

		const projects = normalizeV3ProjectFields(rawProjects)
		const stats = {
			totalDownloads: sumField(projects, 'downloads'),
			totalFollowers: sumField(projects, 'followers'),
			projectCount: projects.length,
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getCollectionBadgeStats(id) {
		const elapsed = startTimer()

		const collection = await this.getCollection(id)
		if (!collection) return null

		let stats = { totalDownloads: 0, totalFollowers: 0, projectCount: 0 }

		if (collection.projects?.length) {
			const projects = await this.getProjects(collection.projects)
			stats = {
				totalDownloads: sumField(projects, 'downloads'),
				totalFollowers: sumField(projects, 'followers'),
				projectCount: projects.length,
			}
		}

		return { stats, timings: { api: elapsed() } }
	}
}

export default new ModrinthPlatform()
