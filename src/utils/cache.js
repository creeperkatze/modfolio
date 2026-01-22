export class Cache {
    constructor(ttlMinutes = 10) {
        this.cache = new Map();
        this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    }

    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    // Get cached value with metadata (cachedAt timestamp)
    getWithMeta(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return { value: item.value, cachedAt: item.cachedAt };
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            cachedAt: Date.now(),
            expiry: Date.now() + this.ttl
        });
    }

    clear() {
        this.cache.clear();
    }

    size() {
        return this.cache.size;
    }
}

// Cache for API data (1 hour TTL)
export const apiCache = new Cache(60);

export default new Cache(10);
