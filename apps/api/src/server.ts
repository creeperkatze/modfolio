import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import dotenv from 'dotenv'
import { Hono } from 'hono'
import path from 'path'

import { checkCrawlerMiddleware } from './middleware/checkCrawler.js'
import { errorHandler } from './middleware/errorHandler.js'
import curseforgeRoutes from './routes/curseforge/index.js'
import hangarRoutes from './routes/hangar/index.js'
import modrinthRoutes from './routes/modrinth/index.js'
import spigotRoutes from './routes/spigot/index.js'
import type { AppEnv } from './types/hono.js'
import logger from './utils/logger.js'
dotenv.config({ quiet: true })

const app = new Hono<AppEnv>()
const port = Number(process.env.PORT) || 3000
const frontendDevUrl = process.env.FRONTEND_DEV_URL || 'http://localhost:5173'

const root = import.meta.dirname // apps/api/src
const publicDir = path.resolve(root, '..', 'public')
const webDist = path.resolve(root, '..', '..', 'web', 'dist')

// In dev, Vite serves the frontend with hot reload. Production serves the built Vue app here.
if (process.env.NODE_ENV !== 'development') {
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
	if (process.env.NODE_ENV === 'development' && accept.includes('html')) {
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
