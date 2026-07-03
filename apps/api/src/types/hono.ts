import type { Context } from 'hono'

export type AppEnv = {
	Variables: {
		isImageCrawler: boolean
		crawlerType: string | null
		isLegacyDomain: boolean
	}
}

export type AppContext = Context<AppEnv>
