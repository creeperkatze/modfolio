import { ref } from 'vue'

export function useClipboard(resetMs = 2000) {
	const copied = ref(false)
	let timer: ReturnType<typeof setTimeout> | null = null

	async function copy(text: string) {
		if (!text) return
		await navigator.clipboard.writeText(text)
		copied.value = true
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => {
			copied.value = false
		}, resetMs)
	}

	return { copied, copy }
}
