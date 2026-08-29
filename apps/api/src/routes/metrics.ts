import { timingSafeEqual } from 'node:crypto'

import { Hono } from 'hono'

import type { AppEnv } from '../types/hono.js'
import { register } from '../utils/metrics.js'

function isAuthorizedMetricsRequest(authHeader: string | undefined): boolean {
	const metricsToken = process.env.METRICS_TOKEN
	if (!metricsToken || !authHeader?.startsWith('Bearer ')) return false

	const provided = Buffer.from(authHeader.slice('Bearer '.length))
	const expected = Buffer.from(metricsToken)

	return provided.length === expected.length && timingSafeEqual(provided, expected)
}

const app = new Hono<AppEnv>()

app.get('/metrics', async (c) => {
	if (!isAuthorizedMetricsRequest(c.req.header('authorization'))) {
		return c.json({ error: 'unauthorized' }, 401)
	}

	const metrics = await register.metrics()
	return c.body(metrics, 200, { 'Content-Type': register.contentType })
})

export default app
