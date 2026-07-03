import { createFactory } from 'hono/factory'

import { getErrorMessage } from '../constants/platformConfig.js'
import { PLATFORMS } from '../constants/platforms.js'
import { generateBadge } from '../generators/badge.js'
import curseforgeClient from '../services/platforms/curseforge.js'
import hangarClient from '../services/platforms/hangar.js'
import modrinthClient from '../services/platforms/modrinth.js'
import spigotClient from '../services/platforms/spigot.js'
import type { AppContext, AppEnv } from '../types/hono.js'
import { apiCache } from '../utils/cache.js'
import { curseforgeKeys, hangarKeys, modrinthKeys, spigotKeys } from '../utils/cacheKeys.js'
import { formatNumber } from '../utils/formatters.js'
import { generatePng } from '../utils/generateImage.js'
import logger from '../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour
const factory = createFactory<AppEnv>()

const BADGE_CONFIGS = {
	// Modrinth entities
	user: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		projects: { label: 'Projects', getValue: (stats) => stats.projectCount.toString() },
		followers: { label: 'Followers', getValue: (stats) => formatNumber(stats.totalFollowers) },
	},
	project: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.downloads) },
		followers: { label: 'Followers', getValue: (stats) => formatNumber(stats.followers) },
		versions: { label: 'Versions', getValue: (stats) => stats.versionCount.toString() },
	},
	organization: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		projects: { label: 'Projects', getValue: (stats) => stats.projectCount.toString() },
		followers: { label: 'Followers', getValue: (stats) => formatNumber(stats.totalFollowers) },
	},
	collection: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		projects: { label: 'Projects', getValue: (stats) => stats.projectCount.toString() },
		followers: { label: 'Followers', getValue: (stats) => formatNumber(stats.totalFollowers) },
	},
	// CurseForge entities
	curseforge_project: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.downloads) },
		versions: { label: 'Files', getValue: (stats) => stats.fileCount.toString() },
		rank: { label: 'Rank', getValue: (stats) => (stats.rank ? `#${stats.rank}` : 'N/A') },
	},
	curseforge_user: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		projects: { label: 'Projects', getValue: (stats) => stats.projectCount.toString() },
		followers: { label: 'Followers', getValue: (stats) => formatNumber(stats.totalFollowers) },
	},
	// Hangar entities
	hangar_project: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.downloads) },
		versions: { label: 'Versions', getValue: (stats) => stats.versionCount.toString() },
		views: { label: 'Views', getValue: (stats) => formatNumber(stats.views) },
	},
	hangar_user: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		projects: { label: 'Projects', getValue: (stats) => stats.projectCount.toString() },
		stars: { label: 'Stars', getValue: (stats) => formatNumber(stats.totalStars) },
	},
	// Spigot entities
	spigot_resource: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.downloads) },
		likes: { label: 'Likes', getValue: (stats) => formatNumber(stats.likes) },
		rating: {
			label: 'Rating',
			getValue: (stats) => (stats.rating ? stats.rating.toFixed(1) : 'N/A'),
		},
		versions: { label: 'Versions', getValue: (stats) => stats.versionCount.toString() },
	},
	spigot_author: {
		downloads: { label: 'Downloads', getValue: (stats) => formatNumber(stats.totalDownloads) },
		resources: { label: 'Resources', getValue: (stats) => stats.resourceCount.toString() },
		rating: {
			label: 'Rating',
			getValue: (stats) => (stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'),
		},
	},
}

const DATA_FETCHERS = {
	// Modrinth fetchers
	user: modrinthClient.getUserBadgeStats.bind(modrinthClient),
	project: modrinthClient.getProjectBadgeStats.bind(modrinthClient),
	organization: modrinthClient.getOrganizationBadgeStats.bind(modrinthClient),
	collection: modrinthClient.getCollectionBadgeStats.bind(modrinthClient),
	// CurseForge fetchers
	curseforge_project: curseforgeClient.getModBadgeStats.bind(curseforgeClient),
	curseforge_user: curseforgeClient.getUserBadgeStats.bind(curseforgeClient),
	// Hangar fetchers
	hangar_project: hangarClient.getProjectBadgeStats.bind(hangarClient),
	hangar_user: hangarClient.getUserBadgeStats.bind(hangarClient),
	// Spigot fetchers
	spigot_resource: spigotClient.getResourceBadgeStats.bind(spigotClient),
	spigot_author: spigotClient.getAuthorBadgeStats.bind(spigotClient),
}

// Platform and cache key mapping for each entity type
const ENTITY_CONFIG = {
	user: {
		platform: PLATFORMS.MODRINTH.id,
		platformName: 'modrinth',
		entityName: 'user',
		cacheKeyFn: modrinthKeys.userBadge,
	},
	project: {
		platform: PLATFORMS.MODRINTH.id,
		platformName: 'modrinth',
		entityName: 'project',
		cacheKeyFn: modrinthKeys.projectBadge,
	},
	organization: {
		platform: PLATFORMS.MODRINTH.id,
		platformName: 'modrinth',
		entityName: 'organization',
		cacheKeyFn: modrinthKeys.organizationBadge,
	},
	collection: {
		platform: PLATFORMS.MODRINTH.id,
		platformName: 'modrinth',
		entityName: 'collection',
		cacheKeyFn: modrinthKeys.collectionBadge,
	},
	curseforge_project: {
		platform: PLATFORMS.CURSEFORGE.id,
		platformName: 'curseforge',
		entityName: 'project',
		cacheKeyFn: curseforgeKeys.projectBadge,
	},
	curseforge_user: {
		platform: PLATFORMS.CURSEFORGE.id,
		platformName: 'curseforge',
		entityName: 'user',
		cacheKeyFn: curseforgeKeys.userBadge,
	},
	hangar_project: {
		platform: PLATFORMS.HANGAR.id,
		platformName: 'hangar',
		entityName: 'project',
		cacheKeyFn: hangarKeys.projectBadge,
	},
	hangar_user: {
		platform: PLATFORMS.HANGAR.id,
		platformName: 'hangar',
		entityName: 'user',
		cacheKeyFn: hangarKeys.userBadge,
	},
	spigot_resource: {
		platform: 'spigot',
		platformName: 'spigot',
		entityName: 'resource',
		cacheKeyFn: spigotKeys.resourceBadge,
	},
	spigot_author: {
		platform: 'spigot',
		platformName: 'spigot',
		entityName: 'author',
		cacheKeyFn: spigotKeys.authorBadge,
	},
}

const handleBadgeRequest = async (c: AppContext, entityType: string, badgeType: string) => {
	const entityConfig = ENTITY_CONFIG[entityType]
	const params = c.req.param()
	const identifier = params.username || params.slug || params.id || params.projectId

	try {
		const platform = entityConfig.platform
		const format = c.req.query('format')
		const isImageCrawler = c.get('isImageCrawler')
		const defaultColor =
			platform === PLATFORMS.CURSEFORGE.id
				? PLATFORMS.CURSEFORGE.defaultColor
				: platform === PLATFORMS.HANGAR.id
					? PLATFORMS.HANGAR.defaultColor
					: platform === 'spigot'
						? '#E8A838'
						: PLATFORMS.MODRINTH.defaultColor
		const color = c.req.query('color') ? `#${c.req.query('color').replace(/^#/, '')}` : defaultColor
		const backgroundColor = c.req.query('backgroundColor')
			? `#${c.req.query('backgroundColor').replace(/^#/, '')}`
			: null
		const showIcon = c.req.query('showIcon') !== 'false'
		const showBorder = c.req.query('showBorder') !== 'false'
		const badgeConfig = BADGE_CONFIGS[entityType][badgeType]

		// Determine if we need to render the svg as a image
		const renderImage = isImageCrawler || format === 'png'

		// API data cache key - independent of styling options
		const apiCacheKey = entityConfig.cacheKeyFn(identifier)

		// Check for cached stats data
		const cached = apiCache.getWithMeta(apiCacheKey)
		let data = cached?.value
		const fromCache = !!data

		if (!data) {
			// Fetch from API (badge stats methods always fetch full data now)
			data = await DATA_FETCHERS[entityType](identifier)

			if (!data) {
				const errorMessage = getErrorMessage(entityConfig.platformName, entityConfig.entityName)

				const message = `Could not show ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge`
				logger.warn(
					{
						target: {
							platform: entityConfig.platformName,
							entity: entityConfig.entityName,
							identifier,
							type: 'badge',
							badge: badgeType,
						},
						error: { message: errorMessage },
					},
					message,
				)

				const notFoundSvg = generateBadge(
					badgeConfig.label,
					'Not found',
					entityConfig.platformName,
					defaultColor,
					null,
					'#f38ba8',
					showIcon,
					showBorder,
				)

				if (renderImage) {
					const { buffer: pngBuffer } = await generatePng(notFoundSvg)
					c.header('Content-Type', 'image/png')
					c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
					return c.body(pngBuffer as any, isImageCrawler ? 200 : 404)
				}

				c.header('Content-Type', 'image/svg+xml')
				c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
				c.header('X-Error-Status', '404')
				return c.body(notFoundSvg, isImageCrawler ? 200 : 404)
			}
			apiCache.set(apiCacheKey, data)
		}

		// Always regenerate the badge from cached data
		const message = `Showing ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge`
		const cacheAgeMs = fromCache ? Date.now() - cached.cachedAt : null
		logger.info(
			{
				target: {
					platform: entityConfig.platformName,
					entity: entityConfig.entityName,
					identifier,
					type: 'badge',
					badge: badgeType,
				},
				cache: fromCache
					? {
							hit: true,
							cachedAt: cached.cachedAt,
							ageMs: cacheAgeMs,
							ageSeconds: Math.round(cacheAgeMs / 1000),
						}
					: { hit: false },
				timing: fromCache ? undefined : { apiMs: data.timings?.api },
			},
			message,
		)
		const value = badgeConfig.getValue(data.stats)
		const svg = generateBadge(
			badgeConfig.label,
			value,
			platform,
			color,
			backgroundColor,
			null,
			showIcon,
			showBorder,
		)

		// Generate PNG for Discord bots or when format=png is requested
		if (renderImage) {
			const { buffer: pngBuffer } = await generatePng(svg)

			const apiTimeHeader = fromCache ? '-1' : `${Math.round(data.timings.api)}ms`

			c.header('Content-Type', 'image/png')
			c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
			c.header('X-Cache', fromCache ? 'HIT' : 'MISS')
			c.header('X-API-Time', apiTimeHeader)
			return c.body(pngBuffer as any)
		}

		// Return SVG
		const apiTimeHeader = fromCache ? '-1' : `${Math.round(data.timings.api)}ms`

		c.header('Content-Type', 'image/svg+xml')
		c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
		c.header('X-Cache', fromCache ? 'HIT' : 'MISS')
		c.header('X-API-Time', apiTimeHeader)
		return c.body(svg)
	} catch (err) {
		const message = `Could not show ${entityConfig.platformName} ${entityConfig.entityName} ${badgeType} badge`
		logger.warn(
			{
				target: {
					platform: entityConfig.platformName,
					entity: entityConfig.entityName,
					identifier,
					type: 'badge',
					badge: badgeType,
				},
				err,
			},
			message,
		)
		throw err
	}
}

// User badges
export const getUserDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'user', 'downloads'),
)
export const getUserProjects = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'user', 'projects'),
)
export const getUserFollowers = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'user', 'followers'),
)

// Project badges
export const getProjectDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'project', 'downloads'),
)
export const getProjectFollowers = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'project', 'followers'),
)
export const getProjectVersions = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'project', 'versions'),
)

// Organization badges
export const getOrganizationDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'organization', 'downloads'),
)
export const getOrganizationProjects = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'organization', 'projects'),
)
export const getOrganizationFollowers = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'organization', 'followers'),
)

// Collection badges
export const getCollectionDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'collection', 'downloads'),
)
export const getCollectionProjects = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'collection', 'projects'),
)
export const getCollectionFollowers = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'collection', 'followers'),
)

// CurseForge mod badges
export const getCfModDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_project', 'downloads'),
)
export const getCfModVersions = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_project', 'versions'),
)
export const getCfModRank = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_project', 'rank'),
)

// CurseForge user badges
export const getCfUserDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_user', 'downloads'),
)
export const getCfUserProjects = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_user', 'projects'),
)
export const getCfUserFollowers = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'curseforge_user', 'followers'),
)

// Hangar project badges
export const getHangarProjectDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_project', 'downloads'),
)
export const getHangarProjectVersions = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_project', 'versions'),
)
export const getHangarProjectViews = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_project', 'views'),
)

// Hangar user badges
export const getHangarUserDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_user', 'downloads'),
)
export const getHangarUserProjects = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_user', 'projects'),
)
export const getHangarUserStars = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'hangar_user', 'stars'),
)

// Spigot resource badges
export const getSpigotResourceDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_resource', 'downloads'),
)
export const getSpigotResourceLikes = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_resource', 'likes'),
)
export const getSpigotResourceRating = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_resource', 'rating'),
)
export const getSpigotResourceVersions = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_resource', 'versions'),
)

// Spigot author badges
export const getSpigotAuthorDownloads = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_author', 'downloads'),
)
export const getSpigotAuthorResources = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_author', 'resources'),
)
export const getSpigotAuthorRating = factory.createHandlers((c) =>
	handleBadgeRequest(c, 'spigot_author', 'rating'),
)
