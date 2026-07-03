import { performance } from 'perf_hooks'

/**
 * Start an API timer. Call the returned function to read elapsed milliseconds.
 * Replaces the `const apiStart = performance.now(); ... performance.now() - apiStart`
 * bookkeeping repeated across every stats method.
 */
export function startTimer(): () => number {
	const start = performance.now()
	return () => performance.now() - start
}
