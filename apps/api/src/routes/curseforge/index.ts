import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import metaRoutes from './metaRoutes.js'
import projectRoutes from './projectRoutes.js'
import userRoutes from './userRoutes.js'

const router = new Hono<AppEnv>()

router.route('/', metaRoutes)
router.route('/', projectRoutes)
router.route('/', userRoutes)

export default router
