import { serve } from '@hono/node-server'

import { app } from './app.js'
import { PORT } from './config/env.js'
import logger from './utils/logger.js'

const server = serve({ fetch: app.fetch, port: PORT }, () => {
	logger.info({ port: PORT }, 'Server listening')
})

const shutdown = () => server.close(() => process.exit(0))
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
