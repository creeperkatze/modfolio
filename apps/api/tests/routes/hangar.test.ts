import { describe, expect, it } from 'vitest'

import { app } from '../../src/app.js'

describe('Hangar routes', () => {
	it('serves a project card', async () => {
		const res = await app.request('/hangar/project/Maintenance')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
		expect(await res.text()).toContain('<svg')
	})

	it('serves a project views badge', async () => {
		const res = await app.request('/hangar/project/Maintenance/views')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves project meta as JSON', async () => {
		const res = await app.request('/hangar/meta/Maintenance')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body).toMatchObject({
			name: expect.any(String),
			url: expect.stringContaining('hangar.papermc.io'),
		})
	})

	it('returns a 404 card for a nonexistent project', async () => {
		const res = await app.request('/hangar/project/this-project-should-not-exist-xyz123')
		expect(res.status).toBe(404)
		expect(res.headers.get('x-error-status')).toBe('404')
	})
})
