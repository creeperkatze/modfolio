import { CARD_LIMITS, getErrorMessage } from '../constants/platformConfig.js'
import { generateCard } from '../generators/card.js'
import { generateErrorCard } from '../middleware/errorHandler.js'
import curseforgeClient from '../services/platforms/curseforge.js'
import hangarClient from '../services/platforms/hangar.js'
import modrinthClient from '../services/platforms/modrinth.js'
import spigotClient from '../services/platforms/spigot.js'
import type { AppContext } from '../types/hono.js'
import { apiCache } from '../utils/cache.js'
import { curseforgeKeys, hangarKeys, modrinthKeys, spigotKeys } from '../utils/cacheKeys.js'
import { generatePng } from '../utils/generateImage.js'
import logger from '../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour

// Map card types to their API clients
const CARD_CLIENTS = {
	modrinth_user: modrinthClient,
	modrinth_project: modrinthClient,
	modrinth_organization: modrinthClient,
	modrinth_collection: modrinthClient,
	curseforge_project: curseforgeClient,
	curseforge_user: curseforgeClient,
	hangar_project: hangarClient,
	hangar_user: hangarClient,
	spigot_resource: spigotClient,
	spigot_author: spigotClient,
}

const CARD_CONFIGS = {
	modrinth_user: {
		paramKey: 'username',
		dataFetcher: (client, id, convertToPng, options) =>
			client.getUserStats(id, convertToPng, options?.projectType),
		cacheKeyFn: modrinthKeys.user,
		entityName: 'user',
		platformId: 'modrinth',
		useUnified: true,
	},
	modrinth_project: {
		paramKey: 'slug',
		dataFetcher: (client, id, convertToPng) => client.getProjectStats(id, convertToPng),
		cacheKeyFn: modrinthKeys.project,
		entityName: 'project',
		platformId: 'modrinth',
		useUnified: true,
	},
	modrinth_organization: {
		paramKey: 'id',
		dataFetcher: (client, id, convertToPng, options) =>
			client.getOrganizationStats(id, convertToPng, options?.projectType),
		cacheKeyFn: modrinthKeys.organization,
		entityName: 'organization',
		platformId: 'modrinth',
		useUnified: true,
	},
	modrinth_collection: {
		paramKey: 'id',
		dataFetcher: (client, id, convertToPng) => client.getCollectionStats(id, convertToPng),
		cacheKeyFn: modrinthKeys.collection,
		entityName: 'collection',
		platformId: 'modrinth',
		useUnified: true,
	},
	curseforge_project: {
		paramKey: 'projectId',
		dataFetcher: (client, id, convertToPng) => client.getModStats(id, convertToPng),
		cacheKeyFn: curseforgeKeys.project,
		entityName: 'project',
		platformId: 'curseforge',
		useUnified: true,
	},
	curseforge_user: {
		paramKey: 'id',
		dataFetcher: (client, id, convertToPng, options) =>
			client.getUserStats(id, convertToPng, options?.projectType),
		cacheKeyFn: curseforgeKeys.user,
		entityName: 'user',
		platformId: 'curseforge',
		useUnified: true,
	},
	hangar_project: {
		paramKey: 'slug',
		dataFetcher: (client, id, convertToPng) => client.getProjectStats(id, convertToPng),
		cacheKeyFn: hangarKeys.project,
		entityName: 'project',
		platformId: 'hangar',
		useUnified: true,
	},
	hangar_user: {
		paramKey: 'username',
		dataFetcher: (client, id, convertToPng) => client.getUserStats(id, convertToPng),
		cacheKeyFn: hangarKeys.user,
		entityName: 'user',
		platformId: 'hangar',
		useUnified: true,
	},
	spigot_resource: {
		paramKey: 'id',
		dataFetcher: (client, id, convertToPng) => client.getResourceStats(id, convertToPng),
		cacheKeyFn: spigotKeys.resource,
		entityName: 'resource',
		platformId: 'spigot',
		useUnified: true,
	},
	spigot_author: {
		paramKey: 'id',
		dataFetcher: (client, id, convertToPng) => client.getAuthorStats(id, convertToPng),
		cacheKeyFn: spigotKeys.author,
		entityName: 'author',
		platformId: 'spigot',
		useUnified: true,
	},
}

const handleCardRequest = async (c: AppContext, cardType: string) => {
	const config = CARD_CONFIGS[cardType]
	const identifier = c.req.param(config.paramKey)

	try {
		const client = CARD_CLIENTS[cardType]
		const format = c.req.query('format')
		const isImageCrawler = c.get('isImageCrawler')

		// Determine if we need to render the svg as a image
		const renderImage = isImageCrawler || format === 'png'

		// Parse customization options
		const options: any = {
			showProjects: c.req.query('showProjects') !== 'false',
			showVersions: c.req.query('showVersions') !== 'false',
			maxProjects: Math.min(
				Math.max(parseInt(c.req.query('maxProjects')) || CARD_LIMITS.DEFAULT_COUNT, 1),
				CARD_LIMITS.MAX_COUNT,
			),
			maxVersions: Math.min(
				Math.max(parseInt(c.req.query('maxVersions')) || CARD_LIMITS.DEFAULT_COUNT, 1),
				CARD_LIMITS.MAX_COUNT,
			),
			relativeTime: c.req.query('relativeTime') !== 'false',
			showSparklines: c.req.query('showSparklines') !== 'false',
			showDownloadBars: c.req.query('showDownloadBars') !== 'false',
			showSummary: c.req.query('showSummary') === 'true',
			showBorder: c.req.query('showBorder') !== 'false',
			animations: !renderImage && c.req.query('animations') !== 'false',
			color: c.req.query('color') ? `#${c.req.query('color').replace(/^#/, '')}` : null,
			backgroundColor: c.req.query('backgroundColor')
				? `#${c.req.query('backgroundColor').replace(/^#/, '')}`
				: null,
			projectType: c.req.query('projectType') || null,
		}

		// API data cache key - includes filter to avoid serving wrong cached data
		const filterSuffix = options.projectType ? `:pt:${options.projectType}` : ''
		const apiCacheKey = config.cacheKeyFn(identifier) + filterSuffix

		// Check for cached API data
		const cached = apiCache.getWithMeta(apiCacheKey)
		let data = cached?.value
		const fromCache = !!data

		if (!data) {
			// Fetch from API with PNG images (works for both SVG and PNG output)
			data = await config.dataFetcher(client, identifier, true, options)

			// Handle not found (null response) without throwing
			if (!data) {
				const errorMessage = getErrorMessage(config.platformId, config.entityName)

				const message = `Could not show ${config.platformId} ${config.entityName} card`
				logger.warn(
					{
						target: {
							platform: config.platformId,
							entity: config.entityName,
							identifier,
							type: 'card',
						},
						error: { message: errorMessage },
					},
					message,
				)

				// Generate error card with platform-specific branding
				const errorSvg = generateErrorCard(
					errorMessage,
					'',
					config.platformId === 'curseforge',
					config.platformId === 'hangar',
					config.platformId === 'spigot',
				)

				if (renderImage) {
					const { buffer: pngBuffer } = await generatePng(errorSvg)
					c.header('Content-Type', 'image/png')
					c.header('Cache-Control', 'no-cache')
					return c.body(pngBuffer as any, isImageCrawler ? 200 : 404)
				}

				c.header('Content-Type', 'image/svg+xml')
				c.header('Cache-Control', 'no-cache')
				c.header('X-Error-Status', '404')
				return c.body(errorSvg, isImageCrawler ? 200 : 404)
			}
			apiCache.set(apiCacheKey, data)
		}

		// Always regenerate the output from cached data
		options.fromCache = fromCache
		const message = `Showing ${config.platformId} ${config.entityName} card`
		const cacheAgeMs = fromCache ? Date.now() - cached.cachedAt : null
		logger.info(
			{
				target: {
					platform: config.platformId,
					entity: config.entityName,
					identifier,
					type: 'card',
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

		// Use unified card generator for all platforms
		const svg = generateCard(data, config.platformId, data.entityType || config.entityName, options)

		// Generate PNG for bots or when format=png is requested
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
		const message = `Could not show ${config.platformId} ${config.entityName} card`
		logger.warn(
			{
				target: {
					platform: config.platformId,
					entity: config.entityName,
					identifier,
					type: 'card',
				},
				err,
			},
			message,
		)
		throw err
	}
}

export const getUser = (c: AppContext) => handleCardRequest(c, 'modrinth_user')
export const getProject = (c: AppContext) => handleCardRequest(c, 'modrinth_project')
export const getOrganization = (c: AppContext) => handleCardRequest(c, 'modrinth_organization')
export const getCollection = (c: AppContext) => handleCardRequest(c, 'modrinth_collection')

// CurseForge project card
export const getCfMod = (c: AppContext) => handleCardRequest(c, 'curseforge_project')

// CurseForge user card
export const getCfUser = (c: AppContext) => handleCardRequest(c, 'curseforge_user')

// Hangar project card
export const getHangarProject = (c: AppContext) => handleCardRequest(c, 'hangar_project')

// Hangar user card
export const getHangarUser = (c: AppContext) => handleCardRequest(c, 'hangar_user')

// Spigot resource card
export const getSpigotResource = (c: AppContext) => handleCardRequest(c, 'spigot_resource')

// Spigot author card
export const getSpigotAuthor = (c: AppContext) => handleCardRequest(c, 'spigot_author')
