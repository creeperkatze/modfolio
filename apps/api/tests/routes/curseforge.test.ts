import { describe, expect, it } from 'vitest'

import { app } from '../../src/app.js'

describe('CurseForge routes', () => {
	it('serves a project card', async () => {
		const res = await app.request('/curseforge/project/238222')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
		expect(await res.text()).toContain('<svg')
	})

	it('serves a user card', async () => {
		const res = await app.request('/curseforge/user/17072262')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a project rank badge', async () => {
		const res = await app.request('/curseforge/project/238222/rank')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a user projects badge', async () => {
		const res = await app.request('/curseforge/user/17072262/projects')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves project meta as JSON', async () => {
		const res = await app.request('/curseforge/meta/project/238222')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body).toMatchObject({
			name: expect.any(String),
			url: expect.stringContaining('curseforge.com'),
		})
	})

	it('resolves a project slug to its numeric id', async () => {
		const res = await app.request('/curseforge/lookup/jei')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.id).toBe(238222)
	})

	it('resolves a username to its numeric id', async () => {
		const res = await app.request('/curseforge/lookup/user/mezz')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.id).toBe('17072262')
	})

	it('returns a 404 card for a nonexistent project', async () => {
		const res = await app.request('/curseforge/project/999999999')
		expect(res.status).toBe(404)
		expect(res.headers.get('x-error-status')).toBe('404')
	})

	it('rejects a non-numeric project id on lookup meta', async () => {
		const res = await app.request('/curseforge/meta/project/not-a-number')
		expect(res.status).toBe(400)
	})
})
