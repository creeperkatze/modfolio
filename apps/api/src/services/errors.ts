import packageJson from '../../../../package.json' with { type: 'json' }
import { upstreamApiDurationSeconds, upstreamApiRequestsTotal } from '../utils/metrics.js'

const VERSION = packageJson.version

export class PlatformApiError extends Error {
	platformName: string
	upstreamStatusCode: number
	statusCode: number
	detailText: string

	constructor(platformName: string, upstreamStatusCode: number, detailText: string) {
		super(`${platformName} API error: ${upstreamStatusCode}: ${detailText}`)
		this.name = 'PlatformApiError'
		this.platformName = platformName
		this.upstreamStatusCode = upstreamStatusCode
		this.statusCode = upstreamStatusCode >= 500 ? 502 : upstreamStatusCode
		this.detailText = detailText
	}
}

export function getDefaultUserAgent() {
	if (process.env.USER_AGENT) {
		return process.env.USER_AGENT.replace('{version}', VERSION)
	}
	// Minimal fallback
	return `modfolio/${VERSION}`
}

export async function callPlatform<T>(
	platformName: string,
	fn: () => Promise<T>,
): Promise<T | null> {
	const stopTimer = upstreamApiDurationSeconds.startTimer({ platform: platformName })
	try {
		const result = await fn()
		upstreamApiRequestsTotal.inc({ platform: platformName, status: 'success' })
		return result
	} catch (err) {
		const status = err?.status ?? err?.statusCode
		if (status >= 400 && status < 500) {
			upstreamApiRequestsTotal.inc({ platform: platformName, status: 'client_error' })
			return null
		}
		upstreamApiRequestsTotal.inc({ platform: platformName, status: 'error' })
		throw new PlatformApiError(platformName, status || 502, err?.message || 'Unknown error')
	} finally {
		stopTimer()
	}
}
