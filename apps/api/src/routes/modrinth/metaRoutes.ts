import { Hono } from 'hono'

import modrinthClient from '../../services/platforms/modrinth.js'
import type { AppEnv } from '../../types/hono.js'
import { apiCache } from '../../utils/cache.js'
import { metaKey, PLATFORM } from '../../utils/cacheKeys.js'
import logger from '../../utils/logger.js'

const API_CACHE_TTL = 3600 // 1 hour

const PROJECT_TYPE_URL_SEGMENT = {
	minecraft_java_server: 'server',
	minecraft_bedrock_server: 'server',
}

const router = new Hono<AppEnv>()

router.get('/modrinth/meta/:type/:id', async (c) => {
	const type = c.req.param('type')
	const id = c.req.param('id')

	try {
		const cacheKey = metaKey(PLATFORM.MODRINTH, type, id)

		const cached = apiCache.getWithMeta(cacheKey)
		const cachedResult = cached?.value

		if (cachedResult) {
			const message = `Showing ${PLATFORM.MODRINTH} ${type} meta`
			const cacheAgeMs = Date.now() - cached.cachedAt
			logger.info(
				{
					target: { platform: PLATFORM.MODRINTH, entity: type, identifier: id, surface: 'meta' },
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
		let data = null

		if (type === 'user') {
			const user = await modrinthClient.getUser(id)
			data = user
			if (!data) {
				return c.json({ error: 'User not found' }, 404)
			}
			name = user.username
			url = `https://modrinth.com/user/${id}`
		} else if (type === 'project') {
			const project = await modrinthClient.getProjectV3(id)
			data = project
			if (!data) {
				return c.json({ error: 'Project not found' }, 404)
			}
			name = project.name || project.title
			const projectType = project.project_types?.[0] || project.project_type
			const urlSegment = PROJECT_TYPE_URL_SEGMENT[projectType] || projectType
			url = `https://modrinth.com/${urlSegment}/${id}`
		} else if (type === 'organization') {
			const org = await modrinthClient.getOrganization(id)
			data = org
			if (!data) {
				return c.json({ error: 'Organization not found' }, 404)
			}
			name = org.name
			url = `https://modrinth.com/organization/${id}`
		} else if (type === 'collection') {
			const collection = await modrinthClient.getCollection(id)
			data = collection
			if (!data) {
				return c.json({ error: 'Collection not found' }, 404)
			}
			name = collection.name
			url = `https://modrinth.com/collection/${id}`
		}

		const result = { name, url }
		apiCache.set(cacheKey, result)
		const message = `Showing ${PLATFORM.MODRINTH} ${type} meta`
		logger.info(
			{
				target: { platform: PLATFORM.MODRINTH, entity: type, identifier: id, surface: 'meta' },
				cache: { hit: false },
			},
			message,
		)

		c.header('Cache-Control', `public, max-age=${API_CACHE_TTL}`)
		return c.json(result)
	} catch (err) {
		const message = `Could not show ${PLATFORM.MODRINTH} ${type} meta`
		logger.warn(
			{
				target: {
					platform: PLATFORM.MODRINTH,
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
