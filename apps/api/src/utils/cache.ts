import { cacheOperationsTotal, cacheSize } from './metrics.js'

export class Cache {
	cache: Map<string, { value: any; cachedAt: number; expiry: number }>
	ttl: number

	constructor(ttlMinutes = 10) {
		this.cache = new Map()
		this.ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
	}

	get(key: string) {
		const item = this.cache.get(key)

		if (!item) {
			cacheOperationsTotal.inc({ result: 'miss' })
			return null
		}

		// Check if expired
		if (Date.now() > item.expiry) {
			this.cache.delete(key)
			cacheSize.set(this.cache.size)
			cacheOperationsTotal.inc({ result: 'miss' })
			return null
		}

		cacheOperationsTotal.inc({ result: 'hit' })
		return item.value
	}

	// Get cached value with metadata (cachedAt timestamp)
	getWithMeta(key: string) {
		const item = this.cache.get(key)

		if (!item) {
			cacheOperationsTotal.inc({ result: 'miss' })
			return null
		}

		// Check if expired
		if (Date.now() > item.expiry) {
			this.cache.delete(key)
			cacheSize.set(this.cache.size)
			cacheOperationsTotal.inc({ result: 'miss' })
			return null
		}

		cacheOperationsTotal.inc({ result: 'hit' })
		return { value: item.value, cachedAt: item.cachedAt }
	}

	set(key: string, value: any) {
		this.cache.set(key, {
			value,
			cachedAt: Date.now(),
			expiry: Date.now() + this.ttl,
		})
		cacheSize.set(this.cache.size)
	}

	clear() {
		this.cache.clear()
		cacheSize.set(0)
	}

	size() {
		return this.cache.size
	}
}

// Cache for API data (1 hour TTL)
export const apiCache = new Cache(60)
