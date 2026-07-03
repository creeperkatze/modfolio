import { performance } from 'perf_hooks'

export function startTimer(): () => number {
	const start = performance.now()
	return () => performance.now() - start
}
