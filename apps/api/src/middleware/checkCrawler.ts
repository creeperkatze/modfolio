import type { Next } from 'hono'

import type { AppContext } from '../types/hono.js'

// Crawlers that require PNG images (social media preview bots)
const IMAGE_CRAWLERS = [
	'Discordbot',
	'Twitterbot',
	'facebookexternalhit',
	'Slackbot',
	'TelegramBot',
	'WhatsApp',
	'LinkedInBot',
	'SkypeUriPreview',
]

// All known crawlers/bots for logging purposes
const ALL_CRAWLERS = [
	...IMAGE_CRAWLERS,
	'github-camo',
	'Dropbox',
	'FacebookBot',
	'GoogleBot',
	'BingBot',
]

export const checkCrawlerMiddleware = async (c: AppContext, next: Next) => {
	const userAgent = c.req.header('user-agent') || ''

	// Check if the request is from an image crawler (social media bots)
	c.set(
		'isImageCrawler',
		IMAGE_CRAWLERS.some((crawler) => userAgent.includes(crawler)),
	)

	// Identify which specific bot it is (for logging)
	c.set('crawlerType', ALL_CRAWLERS.find((crawler) => userAgent.includes(crawler)) || null)

	await next()
}
