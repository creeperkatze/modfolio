import { describe, expect, it, vi } from 'vitest'

import { checkCrawlerMiddleware } from '../../middleware/checkCrawler.js'

function makeReq(userAgent) {
	return { headers: { 'user-agent': userAgent } }
}

function runMiddleware(userAgent) {
	const req = makeReq(userAgent)
	const next = vi.fn()
	checkCrawlerMiddleware(req, {}, next)
	return { req, next }
}

describe('checkCrawlerMiddleware', () => {
	it('calls next()', () => {
		const { next } = runMiddleware('Mozilla/5.0')
		expect(next).toHaveBeenCalledOnce()
	})

	it('sets isImageCrawler to false for regular browser', () => {
		const { req } = runMiddleware('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
		expect(req.isImageCrawler).toBe(false)
		expect(req.crawlerType).toBeNull()
	})

	it('detects Discordbot as image crawler', () => {
		const { req } = runMiddleware('Mozilla/5.0 (compatible; Discordbot/2.0)')
		expect(req.isImageCrawler).toBe(true)
		expect(req.crawlerType).toBe('Discordbot')
	})

	it('detects Twitterbot as image crawler', () => {
		const { req } = runMiddleware('Twitterbot/1.0')
		expect(req.isImageCrawler).toBe(true)
		expect(req.crawlerType).toBe('Twitterbot')
	})

	it('detects facebookexternalhit as image crawler', () => {
		const { req } = runMiddleware('facebookexternalhit/1.1')
		expect(req.isImageCrawler).toBe(true)
		expect(req.crawlerType).toBe('facebookexternalhit')
	})

	it('detects Slackbot as image crawler', () => {
		const { req } = runMiddleware('Slackbot-LinkExpanding 1.0')
		expect(req.isImageCrawler).toBe(true)
		expect(req.crawlerType).toBe('Slackbot')
	})

	it('detects github-camo as non-image crawler', () => {
		const { req } = runMiddleware('github-camo/1.0')
		expect(req.isImageCrawler).toBe(false)
		expect(req.crawlerType).toBe('github-camo')
	})

	it('handles missing user-agent header', () => {
		const req = { headers: {} }
		const next = vi.fn()
		checkCrawlerMiddleware(req, {}, next)
		expect(req.isImageCrawler).toBe(false)
		expect(req.crawlerType).toBeNull()
		expect(next).toHaveBeenCalledOnce()
	})
})
