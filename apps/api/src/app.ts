import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import path from 'path'

import { checkCrawlerMiddleware } from './middleware/checkCrawler.js'
import { checkLegacyDomainMiddleware } from './middleware/checkLegacyDomain.js'
import { errorHandler } from './middleware/errorHandler.js'
import { metricsMiddleware } from './middleware/metrics.js'
import curseforgeRoutes from './routes/curseforge/index.js'
import hangarRoutes from './routes/hangar/index.js'
import metricsRoutes from './routes/metricsRoutes.js'
import modrinthRoutes from './routes/modrinth/index.js'
import spigotRoutes from './routes/spigot/index.js'
import type { AppEnv } from './types/hono.js'

export const app = new Hono<AppEnv>()

const root = import.meta.dirname
const publicDir = path.resolve(root, '..', 'public')
const webDist = path.resolve(root, '..', '..', 'web', 'dist')

// In dev, Vite serves the frontend with hot reload. Production serves the built Vue app here.
if (process.env.NODE_ENV !== 'development') {
	app.use('*', serveStatic({ root: webDist }))
}
app.use('*', serveStatic({ root: publicDir }))

app.use('*', checkCrawlerMiddleware)
app.use('*', checkLegacyDomainMiddleware)

app.route('/', metricsRoutes)
app.use('*', metricsMiddleware)

app.route('/', modrinthRoutes)
app.route('/', curseforgeRoutes)
app.route('/', hangarRoutes)
app.route('/', spigotRoutes)

app.get('/', (c, next) => {
	const accept = c.req.header('accept') || ''
	if (process.env.NODE_ENV === 'development' && accept.includes('html')) {
		const frontendDevUrl = process.env.FRONTEND_DEV_URL || 'http://localhost:5173'
		const url = new URL(c.req.url)
		return c.redirect(`${frontendDevUrl}${url.pathname}${url.search}`)
	}
	return next()
})

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

app.onError((err, c) => errorHandler(err, c))
