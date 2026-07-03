import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import collectionRoutes from './collectionRoutes.js'
import metaRoutes from './metaRoutes.js'
import organizationRoutes from './organizationRoutes.js'
import projectRoutes from './projectRoutes.js'
import userRoutes from './userRoutes.js'

const router = new Hono<AppEnv>()

router.route('/', userRoutes)
router.route('/', projectRoutes)
router.route('/', organizationRoutes)
router.route('/', collectionRoutes)
router.route('/', metaRoutes)

export default router
