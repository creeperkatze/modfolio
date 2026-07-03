import packageJson from '../../../../package.json' with { type: 'json' }
import { USER_AGENT } from '../config/env.js'

const VERSION = packageJson.version

/**
 * A normalized error for any upstream platform API failure. Client (4xx) errors
 * are turned into `null` by `callPlatform` and never reach here; this represents
 * server errors (5xx), network failures, or timeouts, and always surfaces to the
 * caller as a 502 so we never leak an upstream 5xx as our own status.
 */
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

/**
 * Runs a call against a platform client library, normalizing its thrown error into
 * either `null` (client errors, 4xx - treated as "not found") or a `PlatformApiError`
 * (server errors, 5xx, or network/timeout failures) so callers only ever deal with
 * one error shape regardless of which underlying library raised it.
 */
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
