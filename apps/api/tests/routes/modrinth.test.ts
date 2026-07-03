import { describe, expect, it } from 'vitest'

import { app } from '../../src/app.js'

describe('Modrinth routes', () => {
	it('serves a user card', async () => {
		const res = await app.request('/modrinth/user/prospector')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
		expect(await res.text()).toContain('<svg')
	})

	it('serves a project card', async () => {
		const res = await app.request('/modrinth/project/sodium')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
		expect(await res.text()).toContain('<svg')
	})

	it('serves an organization card', async () => {
		const res = await app.request('/modrinth/organization/caffeinemc')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a collection card', async () => {
		const res = await app.request('/modrinth/collection/syf8P1xf')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a user downloads badge', async () => {
		const res = await app.request('/modrinth/user/prospector/downloads')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a project versions badge', async () => {
		const res = await app.request('/modrinth/project/sodium/versions')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves an organization projects badge', async () => {
		const res = await app.request('/modrinth/organization/caffeinemc/projects')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves a collection followers badge', async () => {
		const res = await app.request('/modrinth/collection/syf8P1xf/followers')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('serves project meta as JSON', async () => {
		const res = await app.request('/modrinth/meta/project/sodium')
		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toContain('application/json')
		const body = await res.json()
		expect(body).toMatchObject({ name: expect.any(String), url: expect.stringContaining('modrinth.com') })
	})

	it('serves user meta as JSON', async () => {
		const res = await app.request('/modrinth/meta/user/prospector')
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.name).toBeTypeOf('string')
		expect(body.url).toContain('modrinth.com/user/prospector')
	})

	it('returns a 404 card for a nonexistent user', async () => {
		const res = await app.request('/modrinth/user/this-user-should-not-exist-xyz123')
		expect(res.status).toBe(404)
		expect(res.headers.get('x-error-status')).toBe('404')
		expect(res.headers.get('content-type')).toContain('image/svg+xml')
	})

	it('returns 404 JSON for meta of a nonexistent project', async () => {
		const res = await app.request('/modrinth/meta/project/this-project-should-not-exist-xyz123')
		expect(res.status).toBe(404)
		const body = await res.json()
		expect(body.error).toBeTypeOf('string')
	})
})
