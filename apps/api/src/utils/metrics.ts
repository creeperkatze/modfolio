import client from 'prom-client'

const PREFIX = 'modfolio_'

export const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: PREFIX })

export const httpRequestsTotal = new client.Counter({
	name: `${PREFIX}http_requests_total`,
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status'] as const,
	registers: [register],
})

export const httpRequestDurationSeconds = new client.Histogram({
	name: `${PREFIX}http_request_duration_seconds`,
	help: 'HTTP request duration in seconds',
	labelNames: ['method', 'route'] as const,
	buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
	registers: [register],
})

export const crawlerRequestsTotal = new client.Counter({
	name: `${PREFIX}crawler_requests_total`,
	help: 'Total number of requests from known crawlers/bots',
	labelNames: ['crawler'] as const,
	registers: [register],
})

export const embedRequestsTotal = new client.Counter({
	name: `${PREFIX}embed_requests_total`,
	help: 'Total number of embed (card/badge) requests',
	labelNames: ['platform', 'surface', 'entity', 'format', 'status'] as const,
	registers: [register],
})

export const cacheOperationsTotal = new client.Counter({
	name: `${PREFIX}cache_operations_total`,
	help: 'Total number of API data cache lookups',
	labelNames: ['result'] as const,
	registers: [register],
})

export const cacheSize = new client.Gauge({
	name: `${PREFIX}cache_size`,
	help: 'Number of entries currently stored in the API data cache',
	registers: [register],
})

export const upstreamApiRequestsTotal = new client.Counter({
	name: `${PREFIX}upstream_api_requests_total`,
	help: 'Total requests made to upstream platform APIs',
	labelNames: ['platform', 'status'] as const,
	registers: [register],
})

export const upstreamApiDurationSeconds = new client.Histogram({
	name: `${PREFIX}upstream_api_request_duration_seconds`,
	help: 'Upstream platform API request duration in seconds',
	labelNames: ['platform'] as const,
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [register],
})

export const pngRenderDurationSeconds = new client.Histogram({
	name: `${PREFIX}png_render_duration_seconds`,
	help: 'SVG to PNG rasterization duration in seconds',
	buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
	registers: [register],
})
