import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/collection/:id', cardController.getCollection)

router.get('/collection/:id', (c) => c.redirect(`/modrinth/collection/${c.req.param('id')}`, 301)) // Deprecated

// Badge routes
router.get('/modrinth/collection/:id/downloads', badgeController.getCollectionDownloads)
router.get('/modrinth/collection/:id/projects', badgeController.getCollectionProjects)
router.get('/modrinth/collection/:id/followers', badgeController.getCollectionFollowers)

router.get('/collection/:id/downloads', (c) =>
	c.redirect(`/modrinth/collection/${c.req.param('id')}/downloads`, 301),
) // Deprecated
router.get('/collection/:id/projects', (c) =>
	c.redirect(`/modrinth/collection/${c.req.param('id')}/projects`, 301),
) // Deprecated
router.get('/collection/:id/followers', (c) =>
	c.redirect(`/modrinth/collection/${c.req.param('id')}/followers`, 301),
) // Deprecated

export default router
