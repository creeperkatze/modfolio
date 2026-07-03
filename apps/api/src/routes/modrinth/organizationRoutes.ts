import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/organization/:id', ...cardController.getOrganization)

// Badge routes
router.get('/modrinth/organization/:id/downloads', ...badgeController.getOrganizationDownloads)
router.get('/modrinth/organization/:id/projects', ...badgeController.getOrganizationProjects)
router.get('/modrinth/organization/:id/followers', ...badgeController.getOrganizationFollowers)

export default router
