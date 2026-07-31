import { Hono } from 'hono'

import * as badgeController from '../../controllers/badge.js'
import * as cardController from '../../controllers/card.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/hangar/user/:username', ...cardController.getHangarUser)

// Badge routes
router.get('/hangar/user/:username/downloads', ...badgeController.getHangarUserDownloads)
router.get('/hangar/user/:username/projects', ...badgeController.getHangarUserProjects)
router.get('/hangar/user/:username/stars', ...badgeController.getHangarUserStars)

export default router
