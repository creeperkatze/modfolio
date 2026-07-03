import { Hono } from 'hono'

import curseforgeClient from '../../services/platforms/curseforge.js'
import type { AppEnv } from '../../types/hono.js'
import { apiCache } from '../../utils/cache.js'
import { curseforgeKeys, metaKey, PLATFORM } from '../../utils/cacheKeys.js'
import logger from '../../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour

async function getUsernameSlug(userId) {
	const cacheKey = curseforgeKeys.userIdLookup(userId)
	const cached = apiCache.get(cacheKey)
	if (cached) {
		return cached
	}

	const username = await curseforgeClient.getUsernameFromUserId(userId)
	if (username) {
		apiCache.set(cacheKey, username)
	}
	return username
}

const router = new Hono<AppEnv>()

router.get('/curseforge/meta/:type/:id', async (c) => {
	const type = c.req.param('type')
	const id = c.req.param('id')

	try {
		if (type !== 'project' && type !== 'user') {
			return c.json({ error: `Invalid type: ${type}. Must be 'project' or 'user'` }, 400)
		}

		const cacheKey = metaKey(PLATFORM.CURSEFORGE, type, id)

		const cached = apiCache.getWithMeta(cacheKey)
		const cachedResult = cached?.value

		if (cachedResult) {
			const message = `Showing ${PLATFORM.CURSEFORGE} ${type} meta`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: { platform: PLATFORM.CURSEFORGE, entity: type, identifier: id, surface: 'meta' },
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

		let name = id
		let url = null

		if (type === 'user') {
			if (!/^\d+$/.test(String(id))) {
				return c.json({ error: 'Invalid curseforge user id: must be a number' }, 400)
			}

			const user = await curseforgeClient.getUser(id)
			name = user?.displayName || id

			const usernameSlug = await getUsernameSlug(id)
			if (usernameSlug) {
				url = `https://www.curseforge.com/members/${usernameSlug}`
			} else {
				url = null
			}
		} else if (type === 'project') {
			if (!/^\d+$/.test(String(id))) {
				return c.json({ error: 'Invalid curseforge project id: must be a number' }, 400)
			}

			const mod = await curseforgeClient.getMod(id)
			name = mod?.name || id
			url = mod?.links?.websiteUrl || null
		}

		const result = { name, url }
		apiCache.set(cacheKey, result)
		const message = `Showing ${PLATFORM.CURSEFORGE} ${type} meta`
		logger.info(
			{
				target: { platform: PLATFORM.CURSEFORGE, entity: type, identifier: id, surface: 'meta' },
				cache: { hit: false },
			},
			message,
		)

		c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
		return c.json(result)
	} catch (err) {
		const message = `Could not show ${PLATFORM.CURSEFORGE} ${type} meta`
		logger.warn(
			{
				target: {
					platform: PLATFORM.CURSEFORGE,
					entity: type,
					identifier: id,
					surface: 'meta',
				},
				err,
			},
			message,
		)
		throw err
	}
})

export default router
