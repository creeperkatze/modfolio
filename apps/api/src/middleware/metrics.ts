import type { Next } from 'hono'

import type { AppContext } from '../types/hono.js'
import {
	crawlerRequestsTotal,
	httpRequestDurationSeconds,
	httpRequestsTotal,
} from '../utils/metrics.js'

export const metricsMiddleware = async (c: AppContext, next: Next) => {
	const start = process.hrtime.bigint()
	let status = 500

	try {
		await next()
		status = c.res.status
	} catch (err) {
		status = (err as { statusCode?: number; status?: number })?.statusCode ?? 500
		throw err
	} finally {
		const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9
		const route = c.req.routePath ?? c.req.path
		const method = c.req.method

		httpRequestsTotal.inc({ method, route, status: String(status) })
		httpRequestDurationSeconds.observe({ method, route }, durationSeconds)

		const crawlerType = c.get('crawlerType')
		if (crawlerType) {
			crawlerRequestsTotal.inc({ crawler: crawlerType })
		}
	}
}
