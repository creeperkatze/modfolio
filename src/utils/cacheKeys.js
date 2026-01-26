/**
 * Centralized cache key generation for consistent cache management across platforms.
 *
 * Pattern: ${platform}:${entityType}:${id}[:${suffix}]
 *
 * Examples:
 *   modrinth:user:geometrically
 *   modrinth:user:geometrically:badge
 *   modrinth:project:sodium
 *   curseforge:mod:3915
 *   curseforge:mod:3915:badge
 *   curseforge:slug:geckolib
 */

export const PLATFORM = {
    MODRINTH: "modrinth",
    CURSEFORGE: "curseforge",
    HANGAR: "hangar"
};

export const ENTITY_TYPE = {
    USER: "user",
    PROJECT: "project",
    ORGANIZATION: "organization",
    COLLECTION: "collection",
    MOD: "mod",
    SLUG: "slug"
};

export const SUFFIX = {
    BADGE: "badge",
    CARD: "card"
};

/**
 * Creates a cache key with the standard pattern.
 *
 * @param {string} platform - The platform (modrinth, curseforge)
 * @param {string} entityType - The entity type (user, project, mod, etc.)
 * @param {string} id - The entity identifier
 * @param {string} [suffix] - Optional suffix (badge, card, etc.)
 * @returns {string} The formatted cache key
 */
export function createCacheKey(platform, entityType, id, suffix = null) {
    const parts = [platform, entityType, id];
    if (suffix) {
        parts.push(suffix);
    }
    return parts.join(":");
}

/**
 * Creates a cache key for a Modrinth entity.
 *
 * @param {string} entityType - The entity type (user, project, organization, collection)
 * @param {string} id - The entity identifier
 * @param {string} [suffix] - Optional suffix
 * @returns {string} The formatted cache key
 */
export function modrinthKey(entityType, id, suffix = null) {
    return createCacheKey(PLATFORM.MODRINTH, entityType, id, suffix);
}

/**
 * Creates a cache key for a CurseForge entity.
 *
 * @param {string} entityType - The entity type (mod, slug)
 * @param {string} id - The entity identifier
 * @param {string} [suffix] - Optional suffix
 * @returns {string} The formatted cache key
 */
export function curseforgeKey(entityType, id, suffix = null) {
    return createCacheKey(PLATFORM.CURSEFORGE, entityType, id, suffix);
}

/**
 * Creates a cache key for a badge.
 * Combines entity data into a single badge cache entry per entity.
 *
 * @param {string} platform - The platform (modrinth, curseforge)
 * @param {string} entityType - The entity type
 * @param {string} id - The entity identifier
 * @returns {string} The formatted cache key
 */
export function badgeKey(platform, entityType, id) {
    return createCacheKey(platform, entityType, id, SUFFIX.BADGE);
}

/**
 * Creates a cache key for a card.
 *
 * @param {string} platform - The platform (modrinth, curseforge)
 * @param {string} entityType - The entity type
 * @param {string} id - The entity identifier
 * @returns {string} The formatted cache key
 */
export function cardKey(platform, entityType, id) {
    return createCacheKey(platform, entityType, id, SUFFIX.CARD);
}

/**
 * Creates a cache key for generic metadata.
 *
 * @param {string} platform - The platform (modrinth, curseforge)
 * @param {string} entityType - The entity type
 * @param {string} id - The entity identifier
 * @returns {string} The formatted cache key
 */
export function metaKey(platform, entityType, id) {
    return createCacheKey("meta", platform, entityType, id);
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
    collectionBadge: (id) => badgeKey(PLATFORM.MODRINTH, ENTITY_TYPE.COLLECTION, id)
};

// Convenience exports for common CurseForge entities
export const curseforgeKeys = {
    mod: (id) => curseforgeKey(ENTITY_TYPE.MOD, id),
    modBadge: (id) => badgeKey(PLATFORM.CURSEFORGE, ENTITY_TYPE.MOD, id),
    slugLookup: (slug) => curseforgeKey(ENTITY_TYPE.SLUG, slug)
};

/**
 * Creates a cache key for a Hangar entity.
 *
 * @param {string} entityType - The entity type (project)
 * @param {string} id - The entity identifier
 * @param {string} [suffix] - Optional suffix
 * @returns {string} The formatted cache key
 */
export function hangarKey(entityType, id, suffix = null) {
    return createCacheKey(PLATFORM.HANGAR, entityType, id, suffix);
}

// Convenience exports for common Hangar entities
export const hangarKeys = {
    project: (id) => hangarKey(ENTITY_TYPE.PROJECT, id),
    projectBadge: (id) => badgeKey(PLATFORM.HANGAR, ENTITY_TYPE.PROJECT, id),
    user: (id) => hangarKey(ENTITY_TYPE.USER, id),
    userBadge: (id) => badgeKey(PLATFORM.HANGAR, ENTITY_TYPE.USER, id)
};
