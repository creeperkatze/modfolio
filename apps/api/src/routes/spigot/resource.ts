import { Hono } from 'hono'

import * as badgeController from '../../controllers/badge.js'
import * as cardController from '../../controllers/card.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/spigot/resource/:id', ...cardController.getSpigotResource)

// Badge routes
router.get('/spigot/resource/:id/downloads', ...badgeController.getSpigotResourceDownloads)
router.get('/spigot/resource/:id/likes', ...badgeController.getSpigotResourceLikes)
router.get('/spigot/resource/:id/rating', ...badgeController.getSpigotResourceRating)
router.get('/spigot/resource/:id/versions', ...badgeController.getSpigotResourceVersions)

export default router
