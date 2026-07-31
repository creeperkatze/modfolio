import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import authorRoutes from './author.js'
import metaRoutes from './meta.js'
import resourceRoutes from './resource.js'

const router = new Hono<AppEnv>()

router.route('/', metaRoutes)
router.route('/', resourceRoutes)
router.route('/', authorRoutes)

export default router
