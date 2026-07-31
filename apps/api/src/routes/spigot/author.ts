import { Hono } from 'hono'

import * as badgeController from '../../controllers/badge.js'
import * as cardController from '../../controllers/card.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Card routes
router.get('/spigot/author/:id', ...cardController.getSpigotAuthor)

// Badge routes
router.get('/spigot/author/:id/downloads', ...badgeController.getSpigotAuthorDownloads)
router.get('/spigot/author/:id/resources', ...badgeController.getSpigotAuthorResources)
router.get('/spigot/author/:id/rating', ...badgeController.getSpigotAuthorRating)

export default router
