import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/collection/:id', ...cardController.getCollection)

// Badge routes
router.get('/modrinth/collection/:id/downloads', ...badgeController.getCollectionDownloads)
router.get('/modrinth/collection/:id/projects', ...badgeController.getCollectionProjects)
router.get('/modrinth/collection/:id/followers', ...badgeController.getCollectionFollowers)

export default router
