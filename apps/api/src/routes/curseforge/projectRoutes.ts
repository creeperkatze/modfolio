import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import curseforgeClient from '../../services/platforms/curseforge.js'
import type { AppEnv } from '../../types/hono.js'
import { apiCache } from '../../utils/cache.js'
import { curseforgeKeys, PLATFORM } from '../../utils/cacheKeys.js'
import logger from '../../utils/logger.js'

const router = new Hono<AppEnv>()

router.get('/curseforge/lookup/:slug', async (c) => {
	const slug = c.req.param('slug')

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
})

router.get('/curseforge/lookup/user/:username', async (c) => {
	const username = c.req.param('username')

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
})

// Card routes
router.get('/curseforge/project/:projectId', ...cardController.getCfMod)

// Badge routes
router.get('/curseforge/project/:projectId/downloads', ...badgeController.getCfModDownloads)
router.get('/curseforge/project/:projectId/versions', ...badgeController.getCfModVersions)
router.get('/curseforge/project/:projectId/rank', ...badgeController.getCfModRank)

export default router
