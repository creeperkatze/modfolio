import { Hono } from 'hono'

import type { AppEnv } from '../../types/hono.js'
import collectionRoutes from './collection.js'
import metaRoutes from './meta.js'
import organizationRoutes from './organization.js'
import projectRoutes from './project.js'
import userRoutes from './user.js'

const router = new Hono<AppEnv>()

router.route('/', userRoutes)
router.route('/', projectRoutes)
router.route('/', organizationRoutes)
router.route('/', collectionRoutes)
router.route('/', metaRoutes)

export default router
