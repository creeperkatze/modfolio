import type { Next } from 'hono'

import type { AppContext } from '../types/hono.js'

const LEGACY_HOSTNAME = 'modfolio.creeperkatze.de'

// Pure so it can be unit-tested without spinning up a request
export function isLegacyDomainHost(host: string | null | undefined): boolean {
	const hostname = (host || '').split(':')[0].toLowerCase()
	return hostname === LEGACY_HOSTNAME
}

export const checkLegacyDomainMiddleware = async (c: AppContext, next: Next) => {
	c.set('isLegacyDomain', isLegacyDomainHost(c.req.header('host')))
	await next()
}
