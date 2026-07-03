import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import path from 'path'

import { FRONTEND_DEV_URL, NODE_ENV, PORT } from './config/env.js'
import { checkCrawlerMiddleware } from './middleware/checkCrawler.js'
import { errorHandler } from './middleware/errorHandler.js'
import curseforgeRoutes from './routes/curseforge/index.js'
import hangarRoutes from './routes/hangar/index.js'
import modrinthRoutes from './routes/modrinth/index.js'
import spigotRoutes from './routes/spigot/index.js'
import type { AppEnv } from './types/hono.js'
import logger from './utils/logger.js'

const app = new Hono<AppEnv>()
const port = PORT
const frontendDevUrl = FRONTEND_DEV_URL

const root = import.meta.dirname // apps/api/src
const publicDir = path.resolve(root, '..', 'public')
const webDist = path.resolve(root, '..', '..', 'web', 'dist')

// In dev, Vite serves the frontend with hot reload. Production serves the built Vue app here.
if (NODE_ENV !== 'development') {
	app.use('*', serveStatic({ root: webDist }))
}
app.use('*', serveStatic({ root: publicDir }))

app.use('*', checkCrawlerMiddleware)

app.route('/', modrinthRoutes)
app.route('/', curseforgeRoutes)
app.route('/', hangarRoutes)
app.route('/', spigotRoutes)

app.get('/', (c, next) => {
	const accept = c.req.header('accept') || ''
	if (NODE_ENV === 'development' && accept.includes('html')) {
		const url = new URL(c.req.url)
		return c.redirect(`${frontendDevUrl}${url.pathname}${url.search}`)
	}
	return next()
})

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

app.onError((err, c) => errorHandler(err, c))

serve({ fetch: app.fetch, port }, () => {
	logger.info({ port }, 'Server listening')
})
