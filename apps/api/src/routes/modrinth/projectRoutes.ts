import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/project/:slug', ...cardController.getProject)

router.get('/project/:slug', (c) => c.redirect(`/modrinth/project/${c.req.param('slug')}`, 301)) // Deprecated

// Badge routes
router.get('/modrinth/project/:slug/downloads', ...badgeController.getProjectDownloads)
router.get('/modrinth/project/:slug/followers', ...badgeController.getProjectFollowers)
router.get('/modrinth/project/:slug/versions', ...badgeController.getProjectVersions)

router.get('/project/:slug/downloads', (c) =>
	c.redirect(`/modrinth/project/${c.req.param('slug')}/downloads`, 301),
) // Deprecated
router.get('/project/:slug/followers', (c) =>
	c.redirect(`/modrinth/project/${c.req.param('slug')}/followers`, 301),
) // Deprecated
router.get('/project/:slug/versions', (c) =>
	c.redirect(`/modrinth/project/${c.req.param('slug')}/versions`, 301),
) // Deprecated

export default router
