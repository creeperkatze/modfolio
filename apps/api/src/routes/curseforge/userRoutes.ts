import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/curseforge/user/:id', cardController.getCfUser)

// Badge routes
router.get('/curseforge/user/:id/downloads', badgeController.getCfUserDownloads)
router.get('/curseforge/user/:id/projects', badgeController.getCfUserProjects)
router.get('/curseforge/user/:id/followers', badgeController.getCfUserFollowers)

export default router
