import { describe, expect, it, vi } from 'vitest'

import { checkCrawlerMiddleware } from '../../middleware/checkCrawler.js'

function makeContext(userAgent) {
	const store = new Map<string, unknown>()
	return {
		req: {
			header: (name: string) => (name.toLowerCase() === 'user-agent' ? userAgent : undefined),
		},
		set: (key: string, value: unknown) => store.set(key, value),
		get: (key: string) => store.get(key),
	}
}

async function runMiddleware(userAgent) {
	const c = makeContext(userAgent)
	const next = vi.fn()
	await checkCrawlerMiddleware(c as any, next)
	return { c, next }
}

describe('checkCrawlerMiddleware', () => {
	it('calls next()', async () => {
		const { next } = await runMiddleware('Mozilla/5.0')
		expect(next).toHaveBeenCalledOnce()
	})

	it('sets isImageCrawler to false for regular browser', async () => {
		const { c } = await runMiddleware('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
		expect(c.get('isImageCrawler')).toBe(false)
		expect(c.get('crawlerType')).toBeNull()
	})

	it('detects Discordbot as image crawler', async () => {
		const { c } = await runMiddleware('Mozilla/5.0 (compatible; Discordbot/2.0)')
		expect(c.get('isImageCrawler')).toBe(true)
		expect(c.get('crawlerType')).toBe('Discordbot')
	})

	it('detects Twitterbot as image crawler', async () => {
		const { c } = await runMiddleware('Twitterbot/1.0')
		expect(c.get('isImageCrawler')).toBe(true)
		expect(c.get('crawlerType')).toBe('Twitterbot')
	})

	it('detects facebookexternalhit as image crawler', async () => {
		const { c } = await runMiddleware('facebookexternalhit/1.1')
		expect(c.get('isImageCrawler')).toBe(true)
		expect(c.get('crawlerType')).toBe('facebookexternalhit')
	})

	it('detects Slackbot as image crawler', async () => {
		const { c } = await runMiddleware('Slackbot-LinkExpanding 1.0')
		expect(c.get('isImageCrawler')).toBe(true)
		expect(c.get('crawlerType')).toBe('Slackbot')
	})

	it('detects github-camo as non-image crawler', async () => {
		const { c } = await runMiddleware('github-camo/1.0')
		expect(c.get('isImageCrawler')).toBe(false)
		expect(c.get('crawlerType')).toBe('github-camo')
	})

	it('handles missing user-agent header', async () => {
		const { c, next } = await runMiddleware(undefined)
		expect(c.get('isImageCrawler')).toBe(false)
		expect(c.get('crawlerType')).toBeNull()
		expect(next).toHaveBeenCalledOnce()
	})
})
