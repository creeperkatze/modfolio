import { Hono } from 'hono'

import { getSpigotMeta } from '../../controllers/spigotController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/spigot/meta/:id', getSpigotMeta)

export default router
