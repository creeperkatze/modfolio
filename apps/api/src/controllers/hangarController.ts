import hangarClient from '../services/hangarClient.js'
import type { AppContext } from '../types/hono.js'
import { apiCache } from '../utils/cache.js'
import { metaKey, PLATFORM } from '../utils/cacheKeys.js'
import logger from '../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour;

export const getHangarMeta = async (c: AppContext) => {
	const { slug } = c.req.param()
	const type = c.req.query('type') || 'project'
	const entityType = type === 'user' ? 'user' : 'project'

	try {
		const cacheKey = metaKey(PLATFORM.HANGAR, entityType, slug)

		const cached = apiCache.getWithMeta(cacheKey)
		const cachedResult = cached?.value

		if (cachedResult) {
			const message = `Showing ${PLATFORM.HANGAR} ${entityType} meta`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: {
						platform: PLATFORM.HANGAR,
						entity: entityType,
						identifier: slug,
						surface: 'meta',
					},
					cache: {
						hit: true,
						cachedAt: cached.cachedAt,
						ageMs: cacheAgeMs,
						ageSeconds: Math.round(cacheAgeMs / 1000),
					},
				},
				message,
			)
			c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
			return c.json(cachedResult)
		}

		let data
		let result

		if (entityType === 'user') {
			const userResponse = await hangarClient.getUser(slug)
			data = userResponse
			result = {
				name: data?.name || slug,
				url: `https://hangar.papermc.io/${slug}/`,
			}
		} else {
			const projectResponse = await hangarClient.getProject(slug)
			data = projectResponse
			const projectName = data?.name || slug

			// Hangar project URLs: https://hangar.papermc.io/{owner}/{projectSlug}
			// Try multiple possible fields for the owner/namespace
			const namespace =
				data?.namespace?.owner ||
				data?.namespace?.ownerName ||
				data?.owner?.name ||
				data?.owner?.username ||
				data?.author?.name ||
				data?.author?.username ||
				slug
			result = {
				name: projectName,
				url: `https://hangar.papermc.io/${namespace}/${slug}/`,
			}
		}

		if (!data) {
			return c.json({ error: `${entityType} not found` }, 404)
		}

		apiCache.set(cacheKey, result)
		const message = `Showing ${PLATFORM.HANGAR} ${entityType} meta`
		logger.info(
			{
				target: {
					platform: PLATFORM.HANGAR,
					entity: entityType,
					identifier: slug,
					surface: 'meta',
				},
				cache: { hit: false },
			},
			message,
		)

		c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
		return c.json(result)
	} catch (err) {
		const message = `Could not show ${PLATFORM.HANGAR} ${entityType} meta`
		logger.warn(
			{
				target: { platform: PLATFORM.HANGAR, entity: entityType, identifier: slug, surface: 'meta' },
				err,
			},
			message,
		)
		throw err
	}
}
