import { describe, expect, it } from 'vitest'

import { app } from '../../src/app.js'

describe('Error handling and removed legacy routes', () => {
	it('returns JSON 404 for an unknown route', async () => {
		const res = await app.request('/this-route-does-not-exist')
		expect(res.status).toBe(404)
		const body = await res.json()
		expect(body).toEqual({ error: 'Not Found' })
	})

	it.each([
		'/user/prospector',
		'/project/sodium',
		'/organization/caffeinemc',
		'/collection/syf8P1xf',
		'/card/summary/prospector',
		'/card/user/prospector',
	])('legacy path %s no longer resolves', async (legacyPath) => {
		const res = await app.request(legacyPath)
		expect(res.status).toBe(404)
	})
})
