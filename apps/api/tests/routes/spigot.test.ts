import { describe, expect, it } from 'vitest'

import { app } from '../../src/app.js'

describe('Spigot routes', () => {
	it('serves a resource card', async () => {
		const res = await app.request('/spigot/resource/28140')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
		expect(await res.text()).toContain('<svg')
	})

	it('serves an author card', async () => {
		const res = await app.request('/spigot/author/100356')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a resource likes badge', async () => {
		const res = await app.request('/spigot/resource/28140/likes')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves an author resources badge', async () => {
		const res = await app.request('/spigot/author/100356/resources')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves resource meta as JSON', async () => {
		const res = await app.request('/spigot/meta/28140')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body).toMatchObject({
			name: expect.any(String),
			url: expect.stringContaining('spigotmc.org'),
		})
	})

	it('rejects a non-numeric id', async () => {
		const res = await app.request('/spigot/meta/not-a-number')
		expect(res.status).toBe(400)
	})

	it('returns a 404 card for a nonexistent resource', async () => {
		const res = await app.request('/spigot/resource/999999999')
		expect(res.status).toBe(404)
		expect(res.headers.get('x-error-status')).toBe('404')
	})
})
