import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import path from 'path'
import swaggerUi from 'swagger-ui-express'

import packageJson from '../package.json' with { type: 'json' }
import { checkCrawlerMiddleware } from './middleware/checkCrawler.js'
import { errorHandler } from './middleware/errorHandler.js'
import curseforgeRoutes from './routes/curseforge/index.js'
import hangarRoutes from './routes/hangar/index.js'
import modrinthRoutes from './routes/modrinth/index.js'
import spigotRoutes from './routes/spigot/index.js'
import logger from './utils/logger.js'
dotenv.config({ quiet: true })

const app = express()
const port = process.env.PORT || 3000
const frontendDevUrl = process.env.FRONTEND_DEV_URL || 'http://localhost:5173'

const root = import.meta.dirname // apps/backend/src
const publicDir = path.resolve(root, '..', 'public')
const frontendDist = path.resolve(root, '..', '..', 'frontend', 'dist')

const swaggerDocument = JSON.parse(fs.readFileSync(path.join(publicDir, 'swagger.json'), 'utf8'))
swaggerDocument.info.version = packageJson.version
const swaggerCss = fs.readFileSync(path.join(publicDir, 'swagger.css'), 'utf8')

// In dev, Vite serves the frontend with hot reload. Production serves the built Vue app here.
if (process.env.NODE_ENV !== 'development') {
	app.use(express.static(frontendDist))
}
app.use(express.static(publicDir))

app.use(checkCrawlerMiddleware)

app.use(modrinthRoutes)
app.use(curseforgeRoutes)
app.use(hangarRoutes)
app.use(spigotRoutes)

app.use(
	'/docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerDocument, {
		customSiteTitle: 'Modfolio API Docs',
		customCss: swaggerCss,
	}),
)

app.use((req, res, next) => {
	if (
		process.env.NODE_ENV === 'development' &&
		req.method === 'GET' &&
		req.path === '/' &&
		req.accepts('html')
	) {
		res.redirect(`${frontendDevUrl}${req.originalUrl}`)
		return
	}

	next()
})

app.use((req, res) => {
	res.status(404).json({
		error: 'Not Found',
	})
})

app.use(errorHandler)

app.listen(port, () => {
	logger.info({ port }, 'Server listening')
})
