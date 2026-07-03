import { CARD_LIMITS } from '../../constants/platformConfig.js'
import { enrichImageFromBase64 } from '../../utils/image.js'
import { authorAvatarUrl, resourceIconFallbackUrl, spigotApi } from '../clients/spigot.js'
import { startTimer } from '../timing.js'

const isNumericId = (id) => /^\d+$/.test(String(id))

// Spigot release/update dates are unix seconds; the card system expects ISO strings.
const secondsToIso = (seconds?: number) => (seconds ? new Date(seconds * 1000).toISOString() : null)

// Decodes Spiget's inline icon.data instead of a separate request; SpigotMC URL is just the fallback.
export class SpigotPlatform {
	getResource = spigotApi.getResource.bind(spigotApi)
	getResourceVersions = spigotApi.getResourceVersions.bind(spigotApi)
	getAuthor = spigotApi.getAuthor.bind(spigotApi)
	getAuthorResources = spigotApi.getAuthorResources.bind(spigotApi)

	async getResourceStats(resourceId, convertToPng = false) {
		if (!isNumericId(resourceId)) return null

		const elapsed = startTimer()

		const resource = await this.getResource(resourceId)
		if (!resource) return null

		const imageConversionTime = await enrichImageFromBase64(
			resource,
			resource.icon?.data,
			'icon_url_base64',
			convertToPng,
			resourceIconFallbackUrl(resourceId),
		)

		let versions = []
		let totalVersionCount = 0
		try {
			const versionsResponse = await this.getResourceVersions(resourceId, CARD_LIMITS.MAX_COUNT)
			const allVersions = versionsResponse?.data || []
			totalVersionCount = allVersions.length

			versions = allVersions
				.sort((a, b) => (b.releaseDate || 0) - (a.releaseDate || 0))
				.map((version) => ({
					name: version.name,
					version_number: version.name,
					releaseDate: version.releaseDate * 1000,
					date_published: new Date(version.releaseDate * 1000).toISOString(),
					downloads: version.downloads || 0,
					rating: version.rating?.average || 0,
					loaders: [], // Spigot exposes no loader info per version.
					game_versions: [],
				}))
		} catch {
			// Leave versions empty if the fetch fails.
		}

		return {
			project: resource, // 'project' key keeps parity with the unified card system.
			versions,
			stats: {
				downloads: resource?.downloads || 0,
				likes: resource?.likes || 0,
				rating: resource?.rating?.average || 0,
				ratingCount: resource?.rating?.count || 0,
				versionCount: totalVersionCount,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getAuthorStats(authorId, convertToPng = false) {
		if (!isNumericId(authorId)) return null

		const elapsed = startTimer()

		const author = await this.getAuthor(authorId)
		if (!author) return null

		let imageConversionTime = 0
		imageConversionTime += await enrichImageFromBase64(
			author,
			author.icon?.data,
			'avatar_url_base64',
			convertToPng,
			authorAvatarUrl(authorId),
		)

		let resources = []
		let totalDownloads = 0
		let allVersionDates = []

		try {
			const resourcesResponse = await this.getAuthorResources(authorId, 50) // Fetch extra for sorting.
			const allResources = resourcesResponse?.data || []

			resources = allResources
				.sort((a, b) => (b?.downloads || 0) - (a?.downloads || 0))
				.slice(0, CARD_LIMITS.MAX_COUNT)
				.map((r) => ({
					id: r.id,
					slug: r.id, // Spigot addresses resources by id, not slug.
					name: r.name,
					title: r.name,
					description: r.tag || '',
					downloads: r?.downloads || 0,
					likes: r?.likes || 0,
					rating: r?.rating?.average || 0,
					date_created: secondsToIso(r?.releaseDate),
					createdAt: secondsToIso(r?.releaseDate),
					lastUpdated: secondsToIso(r?.updateDate),
					icon_data: r?.icon?.data || null,
					icon_url_fallback: resourceIconFallbackUrl(r.id),
					project_type: 'plugin',
					category: r?.category,
				}))

			totalDownloads = allResources.reduce((sum, r) => sum + (r?.downloads || 0), 0)

			imageConversionTime += await this.enrichResourceIcons(resources, convertToPng)

			// Use resource release dates for the sparkline (no extra per-resource API calls).
			allVersionDates = allResources.map((r) => secondsToIso(r?.releaseDate)).filter(Boolean)
		} catch {
			// Leave resources empty if the fetch fails.
		}

		return {
			user: author, // 'user'/'projects' keys keep parity with the unified card system.
			projects: resources,
			stats: {
				totalDownloads,
				totalFollowers: 0, // Spigot has no author followers.
				resourceCount: resources.length,
				avgRating: this.calculateAvgRating(resources),
				allVersionDates,
			},
			timings: { api: elapsed(), imageConversion: imageConversionTime },
		}
	}

	async getResourceBadgeStats(resourceId) {
		if (!isNumericId(resourceId)) return null

		const elapsed = startTimer()

		const resource = await this.getResource(resourceId)
		if (!resource) return null

		const stats = {
			downloads: resource?.downloads || 0,
			likes: resource?.likes || 0,
			rating: resource?.rating?.average || 0,
			ratingCount: resource?.rating?.count || 0,
			versionCount: 0,
		}

		try {
			const versionsResponse = await this.getResourceVersions(resourceId)
			stats.versionCount = versionsResponse?.data?.length || 0
		} catch {
			stats.versionCount = 0
		}

		return { stats, timings: { api: elapsed() } }
	}

	async getAuthorBadgeStats(authorId) {
		if (!isNumericId(authorId)) return null

		const elapsed = startTimer()

		const author = await this.getAuthor(authorId)
		if (!author) return null

		let totalDownloads = 0
		let resourceCount = 0
		let totalRating = 0
		let ratingCount = 0

		try {
			const resourcesResponse = await this.getAuthorResources(authorId, 100)
			const allResources = resourcesResponse?.data || []
			totalDownloads = allResources.reduce((sum, r) => sum + (r?.downloads || 0), 0)
			resourceCount = allResources.length

			for (const r of allResources) {
				if (r?.rating?.average) {
					totalRating += r.rating.average
					ratingCount++
				}
			}
		} catch {
			// Use the bare author record if the resource fetch fails.
		}

		return {
			stats: {
				totalDownloads,
				totalFollowers: 0,
				resourceCount,
				avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
			},
			timings: { api: elapsed() },
		}
	}

	private async enrichResourceIcons(resources, convertToPng) {
		let totalConversionTime = 0
		for (const resource of resources) {
			totalConversionTime += await enrichImageFromBase64(
				resource,
				resource.icon_data,
				'icon_url_base64',
				convertToPng,
				resource.icon_url_fallback,
			)
			delete resource.icon_data
		}
		return totalConversionTime
	}

	private calculateAvgRating(resources) {
		const rated = resources.filter((r) => r.rating && r.rating > 0)
		if (rated.length === 0) return 0
		const sum = rated.reduce((acc, r) => acc + r.rating, 0)
		return (sum / rated.length).toFixed(1)
	}

	isConfigured() {
		return true
	}
}

export default new SpigotPlatform()
