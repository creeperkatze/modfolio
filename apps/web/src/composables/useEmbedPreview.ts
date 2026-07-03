import { ref } from 'vue'

import { fetchEmbedMeta } from '../lib/meta'
import type { PlatformId, TargetType } from '../platforms'

export function useEmbedPreview() {
	const loading = ref(false)
	const generationTime = ref<number | null>(null)
	const apiSlow = ref(false)
	const apiError = ref(false)
	const previewSrc = ref<string | null>(null)
	const metaName = ref('')
	const metaUrl = ref<string | null>(null)

	function reset() {
		previewSrc.value = null
		generationTime.value = null
		apiSlow.value = false
		apiError.value = false
		metaName.value = ''
		metaUrl.value = null
	}

	async function inspectHeaders(url: string) {
		try {
			const res = await fetch(url, { method: 'HEAD' })
			const errorStatus = res.headers.get('X-Error-Status')
			const apiTime = res.headers.get('X-API-Time')
			apiError.value = !!(
				errorStatus &&
				(errorStatus.startsWith('5') || ['502', '503', '504'].includes(errorStatus))
			)
			const ms = apiTime?.match(/(\d+)ms/)?.[1]
			apiSlow.value = !!(ms && parseInt(ms) > 2000)
		} catch {
			apiError.value = false
			apiSlow.value = false
		}
	}

	async function generate(
		embedUrl: string | null,
		platform: PlatformId,
		type: TargetType,
		id: string,
	) {
		if (!id || !embedUrl) {
			reset()
			return
		}

		const startTime = performance.now()
		loading.value = true
		generationTime.value = null
		apiSlow.value = false
		apiError.value = false

		const meta = await fetchEmbedMeta(platform, type, id)
		if (meta?.name) metaName.value = meta.name
		if (meta?.url) metaUrl.value = meta.url

		const img = new Image()
		img.src = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`

		img.onload = () => {
			generationTime.value = Math.round(performance.now() - startTime)
			loading.value = false
			previewSrc.value = img.src
			void inspectHeaders(embedUrl)
		}

		img.onerror = () => {
			loading.value = false
			generationTime.value = null
			previewSrc.value = null
			void inspectHeaders(embedUrl)
		}
	}

	return {
		loading,
		generationTime,
		apiSlow,
		apiError,
		previewSrc,
		metaName,
		metaUrl,
		generate,
		reset,
	}
}
