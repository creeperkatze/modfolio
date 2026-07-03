import packageJson from '../../../../package.json' with { type: 'json' }
import { USER_AGENT } from '../config/env.js'

const VERSION = packageJson.version

// 5xx/network/timeout failures; 4xx becomes null via callPlatform instead. Always surfaces as 502.
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
	if (USER_AGENT) {
		return USER_AGENT.replace('{version}', VERSION)
	}
	// Minimal fallback
	return `modfolio/${VERSION}`
}

// Normalizes any platform library's thrown error: 4xx -> null, 5xx/network -> PlatformApiError.
export async function callPlatform<T>(
	platformName: string,
	fn: () => Promise<T>,
): Promise<T | null> {
	try {
		return await fn()
	} catch (err) {
		const status = err?.status ?? err?.statusCode
		if (status >= 400 && status < 500) {
			return null
		}
		throw new PlatformApiError(platformName, status || 502, err?.message || 'Unknown error')
	}
}
