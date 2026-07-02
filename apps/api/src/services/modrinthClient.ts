import { GenericModrinthClient } from '@modrinth/api-client'
import dotenv from 'dotenv'
import { performance } from 'perf_hooks'

import { CARD_LIMITS } from '../constants/platformConfig.js'
import {
	fetchImageAsBase64,
	fetchImagesForProjects,
	fetchVersionDatesForProjects,
} from '../utils/imageFetcher.js'
import {
	aggregateAllStats,
	aggregateProjectStats,
	normalizeV3ProjectFields,
} from '../utils/statsAggregator.js'
import { callPlatform, getDefaultUserAgent } from './baseClient.js'

dotenv.config({ quiet: true })

const MODRINTH_API_URL = process.env.MODRINTH_API_URL || 'https://api.modrinth.com'

const isServerProjectType = (type) =>
	type === 'minecraft_java_server' || type === 'minecraft_bedrock_server'

export class ModrinthClient {
	private client: GenericModrinthClient

	constructor() {
		this.client = new GenericModrinthClient({
			labrinthBaseUrl: MODRINTH_API_URL,
			userAgent: getDefaultUserAgent(),
		})
	}

	async getUser(username): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.users_v2.get(username))
	}

	async getUserProjects(username): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.users_v2.getProjects(username))
	}

	async getProjectV3(slug): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.projects_v3.get(slug))
	}

	async getProjectVersions(slug): Promise<any> {
		return callPlatform('Modrinth', () =>
			this.client.labrinth.versions_v3.getProjectVersions(slug, { include_changelog: false }),
		)
	}

	async getOrganization(id): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.organizations_v3.get(id))
	}

	async getOrganizationProjects(id): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.organizations_v3.getProjects(id))
	}

	async getCollection(id): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.collections.get(id))
	}

	async getProjects(ids): Promise<any> {
		return callPlatform('Modrinth', () => this.client.labrinth.projects_v2.getMultiple(ids))
	}

	async getUserStats(username, convertToPng = false, projectType = null) {
		const apiStart = performance.now()

		const [user, allProjects] = await Promise.all([
			this.getUser(username),
			this.getUserProjects(username),
		])

		if (!user) {
			return null
		}

		const apiTime = performance.now() - apiStart

		const projects = projectType
			? allProjects.filter((p) => p.project_type === projectType)
			: allProjects

		const stats = aggregateAllStats(projects, CARD_LIMITS.MAX_COUNT)
		const topProjects = stats.topProjects

		let imageConversionTime = 0
		const avatarResult = user.avatar_url
			? await fetchImageAsBase64(user.avatar_url, convertToPng)
			: null
		user['avatar_url_base64'] = avatarResult?.data
		if (avatarResult?.conversionTime) imageConversionTime += avatarResult.conversionTime

		const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng)
		imageConversionTime += projectsConversionTime

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this))

		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			user,
			projects,
			stats: {
				...stats,
				allVersionDates,
			},
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getProjectStats(slug, convertToPng = false) {
		const apiStart = performance.now()

		const [projectV3, versions] = await Promise.all([
			this.getProjectV3(slug),
			this.getProjectVersions(slug),
		])

		if (!projectV3) {
			return null
		}

		const project = projectV3
		const isServer = (project.project_types || []).some(isServerProjectType)

		const apiTime = performance.now() - apiStart

		let imageConversionTime = 0
		if (project.icon_url) {
			const result = await fetchImageAsBase64(project.icon_url, convertToPng)
			project['icon_url_base64'] = result?.data
			if (result?.conversionTime) imageConversionTime += result.conversionTime
		}

		const latestVersions = [...versions]
			.sort((a, b) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime())
			.slice(0, CARD_LIMITS.MAX_COUNT)

		let stats
		if (isServer) {
			const javaServer = projectV3.minecraft_java_server
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
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getOrganizationStats(id, convertToPng = false, projectType = null) {
		const apiStart = performance.now()

		const [organization, rawProjects] = await Promise.all([
			this.getOrganization(id),
			this.getOrganizationProjects(id),
		])

		if (!organization) {
			return null
		}

		const apiTime = performance.now() - apiStart

		const allProjects = normalizeV3ProjectFields(rawProjects)
		const projects = projectType
			? allProjects.filter((p) => p.project_type === projectType)
			: allProjects

		const stats = aggregateAllStats(projects, CARD_LIMITS.MAX_COUNT)
		const topProjects = stats.topProjects

		let imageConversionTime = 0
		const orgIconResult = organization.icon_url
			? await fetchImageAsBase64(organization.icon_url, convertToPng)
			: null
		organization['icon_url_base64'] = orgIconResult?.data
		if (orgIconResult?.conversionTime) imageConversionTime += orgIconResult.conversionTime

		const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng)
		imageConversionTime += projectsConversionTime

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this))

		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			organization,
			projects,
			stats: {
				...stats,
				allVersionDates,
			},
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getCollectionStats(id, convertToPng = false) {
		const apiStart = performance.now()

		const collection = await this.getCollection(id)

		if (!collection) {
			return null
		}

		const projects =
			collection.projects && collection.projects.length > 0
				? await this.getProjects(collection.projects)
				: []

		const apiTime = performance.now() - apiStart

		const { totalDownloads, totalFollowers, projectCount, topProjects } = aggregateProjectStats(
			projects,
			CARD_LIMITS.MAX_COUNT,
		)

		let imageConversionTime = 0
		const collectionIconResult = collection.icon_url
			? await fetchImageAsBase64(collection.icon_url, convertToPng)
			: null
		collection['icon_url_base64'] = collectionIconResult?.data
		if (collectionIconResult?.conversionTime)
			imageConversionTime += collectionIconResult.conversionTime

		const projectsConversionTime = await fetchImagesForProjects(topProjects, convertToPng)
		imageConversionTime += projectsConversionTime

		await fetchVersionDatesForProjects(topProjects, this.getProjectVersions.bind(this))

		const allVersionDates = topProjects.flatMap((p) => p.versionDates || [])

		return {
			collection,
			projects,
			stats: {
				totalDownloads,
				totalFollowers,
				projectCount,
				topProjects,
				allVersionDates,
			},
			timings: {
				api: apiTime,
				imageConversion: imageConversionTime,
			},
		}
	}

	async getUserBadgeStats(username) {
		const apiStart = performance.now()

		const [user, projects] = await Promise.all([
			this.getUser(username),
			this.getUserProjects(username),
		])

		if (!user) {
			return null
		}

		const apiTime = performance.now() - apiStart

		const stats = {
			totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
			totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
			projectCount: projects.length,
		}

		return { stats, timings: { api: apiTime } }
	}

	async getProjectBadgeStats(slug) {
		const apiStart = performance.now()

		const project = await this.getProjectV3(slug)

		if (!project) {
			return null
		}

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
		const apiTime = performance.now() - apiStart

		return { stats, timings: { api: apiTime } }
	}

	async getServerBadgeStats(slug) {
		const apiStart = performance.now()

		const project = await this.getProjectV3(slug)

		if (!project) {
			return null
		}

		const apiTime = performance.now() - apiStart

		const javaServer = project.minecraft_java_server
		const stats = {
			followers: project.followers || 0,
			playersOnline: javaServer?.ping?.data?.players_online ?? null,
			verifiedPlays2w: javaServer?.verified_plays_2w ?? null,
		}

		return { stats, timings: { api: apiTime } }
	}

	async getOrganizationBadgeStats(id) {
		const apiStart = performance.now()

		const [organization, rawProjects] = await Promise.all([
			this.getOrganization(id),
			this.getOrganizationProjects(id),
		])

		if (!organization) {
			return null
		}

		const apiTime = performance.now() - apiStart

		const projects = normalizeV3ProjectFields(rawProjects)

		const stats = {
			totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
			totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
			projectCount: projects.length,
		}

		return { stats, timings: { api: apiTime } }
	}

	async getCollectionBadgeStats(id) {
		const apiStart = performance.now()

		const collection = await this.getCollection(id)

		if (!collection) {
			return null
		}

		let stats = {
			totalDownloads: 0,
			totalFollowers: 0,
			projectCount: 0,
		}

		if (collection.projects && collection.projects.length > 0) {
			const projects = await this.getProjects(collection.projects)
			stats = {
				totalDownloads: projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
				totalFollowers: projects.reduce((sum, p) => sum + (p.followers || 0), 0),
				projectCount: projects.length,
			}
		}

		const apiTime = performance.now() - apiStart

		return { stats, timings: { api: apiTime } }
	}
}

export default new ModrinthClient()
