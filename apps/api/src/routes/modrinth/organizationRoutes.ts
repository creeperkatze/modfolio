import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/organization/:id', cardController.getOrganization)

router.get('/organization/:id', (c) =>
	c.redirect(`/modrinth/organization/${c.req.param('id')}`, 301),
) // Deprecated

// Badge routes
router.get('/modrinth/organization/:id/downloads', badgeController.getOrganizationDownloads)
router.get('/modrinth/organization/:id/projects', badgeController.getOrganizationProjects)
router.get('/modrinth/organization/:id/followers', badgeController.getOrganizationFollowers)

router.get('/organization/:id/downloads', (c) =>
	c.redirect(`/modrinth/organization/${c.req.param('id')}/downloads`, 301),
) // Deprecated
router.get('/organization/:id/projects', (c) =>
	c.redirect(`/modrinth/organization/${c.req.param('id')}/projects`, 301),
) // Deprecated
router.get('/organization/:id/followers', (c) =>
	c.redirect(`/modrinth/organization/${c.req.param('id')}/followers`, 301),
) // Deprecated

export default router
