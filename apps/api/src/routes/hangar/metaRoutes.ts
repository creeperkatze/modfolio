import { Hono } from 'hono'

import { getHangarMeta } from '../../controllers/hangarController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/hangar/meta/:slug', getHangarMeta)

export default router
