import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/modrinth/user/:username', ...cardController.getUser)

// Badge routes
router.get('/modrinth/user/:username/downloads', ...badgeController.getUserDownloads)
router.get('/modrinth/user/:username/projects', ...badgeController.getUserProjects)
router.get('/modrinth/user/:username/followers', ...badgeController.getUserFollowers)

export default router
