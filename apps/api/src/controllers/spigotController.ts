import spigotClient from '../services/spigotClient.js'
import type { AppContext } from '../types/hono.js'
import { apiCache } from '../utils/cache.js'
import { metaKey, PLATFORM } from '../utils/cacheKeys.js'
import logger from '../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour

export const getSpigotMeta = async (c: AppContext) => {
	const { id } = c.req.param()
	const type = c.req.query('type') || 'resource'

	try {
		// Validate id is a number
		if (!/^\d+$/.test(String(id))) {
			return c.json({ error: 'Invalid spigot id: must be a number' }, 400)
		}

		const entityType = type === 'author' ? 'author' : 'resource'
		const cacheKey = metaKey(PLATFORM.SPIGOT, entityType, id)

		const cached = apiCache.getWithMeta(cacheKey)
		const cachedResult = cached?.value

		if (cachedResult) {
			const message = `Showing ${PLATFORM.SPIGOT} ${entityType} meta`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: {
						platform: PLATFORM.SPIGOT,
						entity: entityType,
						identifier: id,
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

		if (entityType === 'author') {
			const authorResponse = await spigotClient.getAuthor(id)
			data = authorResponse

			const authorName = data?.name || id
			result = {
				name: authorName,
				url: `https://www.spigotmc.org/resources/authors/${authorName}.${id}/`,
			}
		} else {
			const resourceResponse = await spigotClient.getResource(id)
			data = resourceResponse
			const resourceName = data?.name || id
			result = {
				name: resourceName,
				url: `https://www.spigotmc.org/resources/${id}/`,
			}
		}

		if (!data) {
			return c.json({ error: `${entityType} not found` }, 404)
		}

		apiCache.set(cacheKey, result)
		const message = `Showing ${PLATFORM.SPIGOT} ${entityType} meta`
		logger.info(
			{
				target: { platform: PLATFORM.SPIGOT, entity: entityType, identifier: id, surface: 'meta' },
				cache: { hit: false },
			},
			message,
		)

		c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
		return c.json(result)
	} catch (err) {
		const entity = type === 'author' ? 'author' : 'resource'
		const message = `Could not show ${PLATFORM.SPIGOT} ${entity} meta`
		logger.warn(
			{
				target: { platform: PLATFORM.SPIGOT, entity, identifier: id, surface: 'meta' },
				err,
			},
			message,
		)
		throw err
	}
}
