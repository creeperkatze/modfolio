import curseforgeClient from '../services/platforms/curseforge.js'
import type { AppContext } from '../types/hono.js'
import { apiCache } from '../utils/cache.js'
import { curseforgeKeys, metaKey, PLATFORM } from '../utils/cacheKeys.js'
import logger from '../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour

/**
 * Get cached username for a user ID, or fetch it via search API
 */
async function getUsernameSlug(userId) {
	// Check cache first
	const cacheKey = curseforgeKeys.userIdLookup(userId)
	const cached = apiCache.get(cacheKey)
	if (cached) {
		return cached
	}

	// Fetch username by searching for the user's projects
	const username = await curseforgeClient.getUsernameFromUserId(userId)
	if (username) {
		// Cache the username for future use
		apiCache.set(cacheKey, username)
	}
	return username
}

export const getCfUserLookup = async (c: AppContext) => {
	const { username } = c.req.param()

	try {
		if (!username) {
			return c.json({ error: 'Username is required' }, 400)
		}

		if (/^\d+$/.test(username)) {
			return c.json({ id: username })
		}

		const cacheKey = curseforgeKeys.userLookup(username)
		const cached = apiCache.getWithMeta(cacheKey)

		if (cached?.value) {
			const message = `Showing ${PLATFORM.CURSEFORGE} user lookup`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: {
						platform: PLATFORM.CURSEFORGE,
						entity: 'user',
						identifier: username,
						surface: 'lookup',
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
			return c.json({ id: cached.value })
		}

		const userId = await curseforgeClient.getUserIdFromUsername(username)
		apiCache.set(cacheKey, userId)
		const message = `Showing ${PLATFORM.CURSEFORGE} user lookup`
		logger.info(
			{
				target: {
					platform: PLATFORM.CURSEFORGE,
					entity: 'user',
					identifier: username,
					surface: 'lookup',
				},
				cache: { hit: false },
			},
			message,
		)

		// Cache reverse mapping (ID -> username) for profile URL generation
		const reverseCacheKey = curseforgeKeys.userIdLookup(userId)
		apiCache.set(reverseCacheKey, username)

		return c.json({ id: userId })
	} catch (err) {
		const message = `Could not show ${PLATFORM.CURSEFORGE} user lookup`
		logger.warn(
			{
				target: {
					platform: PLATFORM.CURSEFORGE,
					entity: 'user',
					identifier: username,
					surface: 'lookup',
				},
				err,
			},
			message,
		)
		return c.json({ error: 'User not found', message: err.message }, 404)
	}
}

export const getCfSlugLookup = async (c: AppContext) => {
	const { slug } = c.req.param()

	try {
		if (!slug) {
			return c.json({ error: 'Slug is required' }, 400)
		}

		const cacheKey = curseforgeKeys.slugLookup(slug)
		const cached = apiCache.getWithMeta(cacheKey)

		if (cached?.value) {
			const message = `Showing ${PLATFORM.CURSEFORGE} project lookup`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: {
						platform: PLATFORM.CURSEFORGE,
						entity: 'project',
						identifier: slug,
						surface: 'lookup',
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
			return c.json({ id: cached.value })
		}

		const modId = await curseforgeClient.searchModBySlug(slug)
		apiCache.set(cacheKey, modId)
		const message = `Showing ${PLATFORM.CURSEFORGE} project lookup`
		logger.info(
			{
				target: {
					platform: PLATFORM.CURSEFORGE,
					entity: 'project',
					identifier: slug,
					surface: 'lookup',
				},
				cache: { hit: false },
			},
			message,
		)

		return c.json({ id: modId })
	} catch (err) {
		const message = `Could not show ${PLATFORM.CURSEFORGE} project lookup`
		logger.warn(
			{
				target: {
					platform: PLATFORM.CURSEFORGE,
					entity: 'project',
					identifier: slug,
					surface: 'lookup',
				},
				err,
			},
			message,
		)
		return c.json({ error: 'Project not found', message: err.message }, 404)
	}
}

export const getCurseforgeMeta = async (c: AppContext) => {
	const { type, id } = c.req.param()

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
			// Validate user id is a number
			if (!/^\d+$/.test(String(id))) {
				return c.json({ error: 'Invalid curseforge user id: must be a number' }, 400)
			}

			const user = await curseforgeClient.getUser(id)
			name = user?.displayName || id

			// Get username slug for profile URL (fetches via search API if not cached)
			const usernameSlug = await getUsernameSlug(id)
			if (usernameSlug) {
				url = `https://www.curseforge.com/members/${usernameSlug}`
			} else {
				url = null
			}
		} else if (type === 'project') {
			// Validate project id is a number
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
}
