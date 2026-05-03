import { describe, it, expect, beforeEach, vi } from "vitest";
import { Cache } from "../../utils/cache.js";

describe("Cache", () => {
    let cache;

    beforeEach(() => {
        cache = new Cache(1); // 1 minute TTL
    });

    it("returns null for missing keys", () => {
        expect(cache.get("missing")).toBeNull();
    });

    it("stores and retrieves values", () => {
        cache.set("key", "value");
        expect(cache.get("key")).toBe("value");
    });

    it("stores and retrieves object values", () => {
        const obj = { a: 1, b: "two" };
        cache.set("obj", obj);
        expect(cache.get("obj")).toEqual(obj);
    });

    it("returns null for expired entries", () => {
        const expiredCache = new Cache(0); // 0-minute TTL expires immediately
        expiredCache.set("key", "value");
        // Fake time forward
        vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60001);
        expect(expiredCache.get("key")).toBeNull();
        vi.restoreAllMocks();
    });

    it("removes expired entries from cache on get", () => {
        const expiredCache = new Cache(0);
        expiredCache.set("key", "value");
        vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60001);
        expiredCache.get("key");
        expect(expiredCache.size()).toBe(0);
        vi.restoreAllMocks();
    });

    it("tracks size correctly", () => {
        expect(cache.size()).toBe(0);
        cache.set("a", 1);
        cache.set("b", 2);
        expect(cache.size()).toBe(2);
    });

    it("clears all entries", () => {
        cache.set("a", 1);
        cache.set("b", 2);
        cache.clear();
        expect(cache.size()).toBe(0);
        expect(cache.get("a")).toBeNull();
    });

    describe("getWithMeta", () => {
        it("returns null for missing keys", () => {
            expect(cache.getWithMeta("missing")).toBeNull();
        });

        it("returns value with cachedAt timestamp", () => {
            const before = Date.now();
            cache.set("key", "value");
            const result = cache.getWithMeta("key");
            expect(result.value).toBe("value");
            expect(result.cachedAt).toBeGreaterThanOrEqual(before);
            expect(result.cachedAt).toBeLessThanOrEqual(Date.now());
        });

        it("returns null for expired entries", () => {
            const expiredCache = new Cache(0);
            expiredCache.set("key", "value");
            vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60001);
            expect(expiredCache.getWithMeta("key")).toBeNull();
            vi.restoreAllMocks();
        });
    });
});
