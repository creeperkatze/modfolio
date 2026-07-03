import { CARD_LIMITS } from '../../constants/platformConfig.js'
import { enrichImage, fetchVersionDatesForProjects } from '../../utils/image.js'
import {
	curseforgeApi,
	extractGameVersions,
	extractLoaders,
	latestFile,
	ModsSearchSortField,
} from '../clients/curseforge.js'
import { startTimer } from '../timing.js'

const isNumericId = (id) => /^\d+$/.test(String(id))

// Twitch-hosted CurseForge avatars use a `{0}` size placeholder.
const sizedAvatar = (url?: string) => url?.replace('{0}', '300x300')

// Assembles curseforgeApi search results into card/badge payloads. Loader parsing: clients/curseforge.ts.
export class CurseforgePlatform {
	getMod = curseforgeApi.getMod.bind(curseforgeApi)
	getUser = curseforgeApi.getUser.bind(curseforgeApi)
	searchModBySlug = curseforgeApi.searchModBySlug.bind(curseforgeApi)
	getUserIdFromUsername = curseforgeApi.getUserIdFromUsername.bind(curseforgeApi)
	getUsernameFromUserId = curseforgeApi.getUsernameFromUserId.bind(curseforgeApi)

	getModFiles(modId, pageSize = CARD_LIMITS.MAX_COUNT) {
		return curseforgeApi.getModFiles(modId, pageSize)
	}

	async getModStats(modId, convertToPng = false) {
		if (!isNumericId(modId)) return null

		const elapsed = startTimer()

		const mod = await this.getMod(modId)
		if (!mod) return null

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(mod, mod.logo?.url, 'icon_url_base64', convertToPng)

		// Always fetch max for caching; the card generator slices to maxVersions.
		let versions = []
		let totalFileCount = 0
		try {
			const filesResponse = await this.getModFiles(modId, CARD_LIMITS.MAX_COUNT)
			const allFiles = filesResponse?.data || []
			totalFileCount = filesResponse?.pagination?.totalCount ?? allFiles.length

			versions = allFiles
				.sort((a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime())
				.slice(0, CARD_LIMITS.MAX_COUNT)
				.map((file) => ({
					version_number: file.displayName || file.fileName,
					date_published: file.fileDate,
					loaders: extractLoaders(file),
					game_versions: extractGameVersions(file),
					downloads: file.downloadCount || 0,
				}))
		} catch {
			// Leave versions empty if the files fetch fails.
		}

		return {
			// 'project'/'versions'/'versionCount' keys keep parity with the unified card system.
			project: mod,
			versions,
			stats: {
				downloads: mod?.downloadCount || 0,
				versionCount: totalFileCount,
				fileCount: totalFileCount,
				rank: mod?.gamePopularityRank || null,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getModBadgeStats(modId) {
		if (!isNumericId(modId)) return null

		const elapsed = startTimer()

		const mod = await this.getMod(modId)
		if (!mod) return null

		const stats = {
			downloads: mod?.downloadCount || 0,
			versionCount: 0,
			fileCount: 0,
			rank: mod?.gamePopularityRank || null,
		}

		try {
			const filesResponse = await this.getModFiles(modId)
			const count = filesResponse?.pagination?.totalCount ?? filesResponse?.data?.length ?? 0
			stats.versionCount = count
			stats.fileCount = count
		} catch {
			stats.versionCount = 0
			stats.fileCount = 0
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getUserStats(userId, convertToPng = false, classId = null) {
		if (!isNumericId(userId)) return null

		const elapsed = startTimer()

		const user = await this.getUser(userId)
		if (!user) return null

		let imageConversionTime = 0
		imageConversionTime += await enrichImage(
			user,
			sizedAvatar(user?.avatarUrl),
			'avatar_url_base64',
			convertToPng,
		)

		let projects = []
		let projectCount = 0
		try {
			const searchResponse = await curseforgeApi.searchMods({
				authorId: Number(userId),
				pageSize: CARD_LIMITS.MAX_COUNT,
				sortField: ModsSearchSortField.TotalDownloads,
				sortOrder: 'desc',
				...(classId ? { classId: Number(classId) } : {}),
			})
			const searchResults = searchResponse.data || []
			projectCount = searchResponse.pagination?.totalCount || searchResults.length

			projects = await Promise.all(
				searchResults.map(async (mod) => {
					const project = {
						id: mod.id,
						title: mod.name,
						slug: mod.slug,
						description: mod.summary,
						downloads: mod.downloadCount || 0,
						followers: 0, // CurseForge has no per-mod followers.
						date_created: mod.dateCreated,
						icon_url_base64: null,
						icon: mod.logo?.url || null,
						loaders: [],
					}

					imageConversionTime += await enrichImage(
						project,
						mod.logo?.url,
						'icon_url_base64',
						convertToPng,
					)

					// Avoids a per-mod files request — search results already include latestFiles.
					const file = latestFile(mod.latestFiles)
					if (file) project.loaders = extractLoaders(file)

					return project
				}),
			)

			await fetchVersionDatesForProjects(projects, async (modId) => {
				const filesResponse = await this.getModFiles(modId, 50)
				return (filesResponse?.data || []).map((file) => ({ date_published: file.fileDate }))
			})
		} catch {
			// Leave projects empty if the search fails.
		}

		const allVersionDates = projects.flatMap((p) => p.versionDates || [])

		const mappedUser = {
			name: user.displayName,
			username: user.displayName,
			avatar_url_base64: user['avatar_url_base64'],
			avatarUrl: sizedAvatar(user.avatarUrl),
			date_created: user.dateCreated,
		}

		// When filtering by class, sum only the filtered projects; otherwise prefer the user total.
		const projectsDownloads = projects.reduce((sum, p) => sum + (p.downloads || 0), 0)
		const totalDownloads = classId
			? projectsDownloads
			: user?.['modsDownloadCount'] || projectsDownloads

		return {
			user: mappedUser,
			projects,
			stats: {
				totalDownloads,
				projectCount,
				totalFollowers: user?.['followerCount'] || 0,
				allVersionDates,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getUserBadgeStats(userId) {
		if (!isNumericId(userId)) return null

		const elapsed = startTimer()

		const user = await this.getUser(userId)
		if (!user) return null

		let projectCount = 0
		try {
			const searchResponse = await curseforgeApi.searchMods({
				authorId: Number(userId),
				pageSize: 1,
			})
			projectCount = searchResponse.pagination?.totalCount || 0
		} catch {
			// projectCount stays 0.
		}

		return {
			stats: {
				totalDownloads: user?.['modsDownloadCount'] || 0,
				projectCount,
				totalFollowers: user?.['followerCount'] || 0,
			},
			timings: { api: elapsed() },
		}
	}
}

export default new CurseforgePlatform()
