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

// Cache key pattern: platform:entityType:id[:suffix] (e.g. modrinth:user:geometrically:badge)

export const PLATFORM = {
	MODRINTH: 'modrinth',
	CURSEFORGE: 'curseforge',
	HANGAR: 'hangar',
	SPIGOT: 'spigot',
}

export const ENTITY_TYPE = {
	USER: 'user',
	PROJECT: 'project',
	ORGANIZATION: 'organization',
	COLLECTION: 'collection',
	MOD: 'mod',
	SLUG: 'slug',
}

export const SUFFIX = {
	BADGE: 'badge',
	CARD: 'card',
}

export function createCacheKey(platform, entityType, id, suffix = null) {
	const parts = [platform, entityType, id]
	if (suffix) {
		parts.push(suffix)
	}
	return parts.join(':')
}

export function modrinthKey(entityType, id, suffix = null) {
	return createCacheKey(PLATFORM.MODRINTH, entityType, id, suffix)
}

export function curseforgeKey(entityType, id, suffix = null) {
	return createCacheKey(PLATFORM.CURSEFORGE, entityType, id, suffix)
}

export function badgeKey(platform, entityType, id) {
	return createCacheKey(platform, entityType, id, SUFFIX.BADGE)
}

export function cardKey(platform, entityType, id) {
	return createCacheKey(platform, entityType, id, SUFFIX.CARD)
}

export function metaKey(platform, entityType, id) {
	return createCacheKey('meta', platform, entityType, id)
}

// Convenience exports for common Modrinth entities
export const modrinthKeys = {
	user: (id) => modrinthKey(ENTITY_TYPE.USER, id),
	userBadge: (id) => badgeKey(PLATFORM.MODRINTH, ENTITY_TYPE.USER, id),
	project: (id) => modrinthKey(ENTITY_TYPE.PROJECT, id),
	projectBadge: (id) => badgeKey(PLATFORM.MODRINTH, ENTITY_TYPE.PROJECT, id),
	organization: (id) => modrinthKey(ENTITY_TYPE.ORGANIZATION, id),
	organizationBadge: (id) => badgeKey(PLATFORM.MODRINTH, ENTITY_TYPE.ORGANIZATION, id),
	collection: (id) => modrinthKey(ENTITY_TYPE.COLLECTION, id),
	collectionBadge: (id) => badgeKey(PLATFORM.MODRINTH, ENTITY_TYPE.COLLECTION, id),
}

// Convenience exports for common CurseForge entities
export const curseforgeKeys = {
	project: (id) => curseforgeKey(ENTITY_TYPE.PROJECT, id),
	projectBadge: (id) => badgeKey(PLATFORM.CURSEFORGE, ENTITY_TYPE.PROJECT, id),
	slugLookup: (slug) => curseforgeKey(ENTITY_TYPE.SLUG, slug),
	user: (id) => curseforgeKey(ENTITY_TYPE.USER, id),
	userBadge: (id) => badgeKey(PLATFORM.CURSEFORGE, ENTITY_TYPE.USER, id),
	userLookup: (username) => curseforgeKey('userLookup', username),
	userIdLookup: (userId) => curseforgeKey('userIdLookup', userId),
}

export function hangarKey(entityType, id, suffix = null) {
	return createCacheKey(PLATFORM.HANGAR, entityType, id, suffix)
}

// Convenience exports for common Hangar entities
export const hangarKeys = {
	project: (id) => hangarKey(ENTITY_TYPE.PROJECT, id),
	projectBadge: (id) => badgeKey(PLATFORM.HANGAR, ENTITY_TYPE.PROJECT, id),
	user: (id) => hangarKey(ENTITY_TYPE.USER, id),
	userBadge: (id) => badgeKey(PLATFORM.HANGAR, ENTITY_TYPE.USER, id),
}

export function spigotKey(entityType, id, suffix = null) {
	return createCacheKey(PLATFORM.SPIGOT, entityType, id, suffix)
}

// Convenience exports for common Spigot entities
export const spigotKeys = {
	resource: (id) => spigotKey('resource', id),
	resourceBadge: (id) => badgeKey(PLATFORM.SPIGOT, 'resource', id),
	author: (id) => spigotKey('author', id),
	authorBadge: (id) => badgeKey(PLATFORM.SPIGOT, 'author', id),
}
