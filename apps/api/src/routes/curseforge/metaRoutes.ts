import { Hono } from 'hono'

import { getCurseforgeMeta } from '../../controllers/curseforgeController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/curseforge/meta/:type/:id', getCurseforgeMeta)

export default router
