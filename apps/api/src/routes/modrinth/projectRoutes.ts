import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/project/:slug', ...cardController.getProject)

// Badge routes
router.get('/modrinth/project/:slug/downloads', ...badgeController.getProjectDownloads)
router.get('/modrinth/project/:slug/followers', ...badgeController.getProjectFollowers)
router.get('/modrinth/project/:slug/versions', ...badgeController.getProjectVersions)

export default router
