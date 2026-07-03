export function debounce<Args extends unknown[]>(
	fn: (...args: Args) => void,
	ms: number,
): (...args: Args) => void {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: Args) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => fn(...args), ms)
	}
}
