import express from 'express'

import authorRoutes from './authorRoutes.js'
import metaRoutes from './metaRoutes.js'
import resourceRoutes from './resourceRoutes.js'

const router = express.Router()

router.use(metaRoutes)
router.use(resourceRoutes)
router.use(authorRoutes)

export default router
