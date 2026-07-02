import { Hono } from 'hono'

import { getModrinthMeta } from '../../controllers/modrinthController.js'
import type { AppEnv } from '../../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/modrinth/meta/:type/:id', getModrinthMeta)

export default router
