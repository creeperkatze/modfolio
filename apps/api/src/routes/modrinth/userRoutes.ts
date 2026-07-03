import { Hono } from 'hono'

import * as badgeController from '../../controllers/badgeController.js'
import * as cardController from '../../controllers/cardController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

// Deprecated
router.get('/card/summary/:username', (c) => c.redirect('/')) // Deprecated
router.get('/card/user/:username', (c) => c.redirect('/')) // Deprecated

// Card routes
router.get('/modrinth/user/:username', ...cardController.getUser)

router.get('/user/:username', (c) => c.redirect(`/modrinth/user/${c.req.param('username')}`, 301)) // Deprecated

// Badge routes
router.get('/modrinth/user/:username/downloads', ...badgeController.getUserDownloads)
router.get('/modrinth/user/:username/projects', ...badgeController.getUserProjects)
router.get('/modrinth/user/:username/followers', ...badgeController.getUserFollowers)

router.get('/user/:username/downloads', (c) =>
	c.redirect(`/modrinth/user/${c.req.param('username')}/downloads`, 301),
) // Deprecated
router.get('/user/:username/projects', (c) =>
	c.redirect(`/modrinth/user/${c.req.param('username')}/projects`, 301),
) // Deprecated
router.get('/user/:username/followers', (c) =>
	c.redirect(`/modrinth/user/${c.req.param('username')}/followers`, 301),
) // Deprecated

export default router
