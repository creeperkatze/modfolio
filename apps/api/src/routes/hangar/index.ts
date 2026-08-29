import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import metaRoutes from './meta.js'
import projectRoutes from './project.js'
import userRoutes from './user.js'

const router = new Hono<AppEnv>()

router.route('/', metaRoutes)
router.route('/', projectRoutes)
router.route('/', userRoutes)

export default router
