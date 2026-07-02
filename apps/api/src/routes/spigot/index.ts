import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import authorRoutes from './authorRoutes.js'
import metaRoutes from './metaRoutes.js'
import resourceRoutes from './resourceRoutes.js'

const router = new Hono<AppEnv>()

router.route('/', metaRoutes)
router.route('/', resourceRoutes)
router.route('/', authorRoutes)

export default router
