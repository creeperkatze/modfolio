import { describe, expect, it } from 'vitest'

import { pLimit, requestDeduplicator } from '../../utils/asyncUtils.js'

describe('pLimit', () => {
	it('resolves all promises', async () => {
		const tasks = [1, 2, 3].map((n) => () => Promise.resolve(n * 2))
		const results = await pLimit(tasks, 2)
		expect(results).toEqual([2, 4, 6])
	})

	it('respects concurrency limit', async () => {
		let concurrent = 0
		let maxConcurrent = 0

		const tasks = Array.from({ length: 6 }, () => async () => {
			concurrent++
			maxConcurrent = Math.max(maxConcurrent, concurrent)
			await new Promise((r) => setTimeout(r, 10))
			concurrent--
		})

		await pLimit(tasks, 3)
		expect(maxConcurrent).toBeLessThanOrEqual(3)
	})

	it('handles empty array', async () => {
		const results = await pLimit([], 2)
		expect(results).toEqual([])
	})
})

describe('RequestDeduplicator', () => {
	it('returns the same promise for duplicate concurrent requests', async () => {
		let callCount = 0
		const fetcher = () =>
			new Promise((r) => {
				callCount++
				setTimeout(() => r('data'), 10)
			})

		const p1 = requestDeduplicator.dedupe('key', fetcher)
		const p2 = requestDeduplicator.dedupe('key', fetcher)

		const [r1, r2] = await Promise.all([p1, p2])
		expect(callCount).toBe(1)
		expect(r1).toBe(r2)
	})

	it('allows a new request after previous one resolves', async () => {
		let callCount = 0
		const fetcher = () =>
			new Promise((r) => {
				callCount++
				r('data')
			})

		await requestDeduplicator.dedupe('key2', fetcher)
		await requestDeduplicator.dedupe('key2', fetcher)
		expect(callCount).toBe(2)
	})

	it('clear removes pending entries', () => {
		const fetcher = () => new Promise(() => {}) // never resolves
		requestDeduplicator.dedupe('key3', fetcher)
		requestDeduplicator.clear()
		// After clear, a new call should invoke fetcher again
		let called = false
		requestDeduplicator.dedupe('key3', () => {
			called = true
			return Promise.resolve()
		})
		expect(called).toBe(true)
	})
})
