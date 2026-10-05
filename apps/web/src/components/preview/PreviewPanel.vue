<template>
	<div class="flex flex-col gap-2">
		<Alert v-if="apiSlow" variant="warning">
			{{ t(m.apiSlow.id, { platform: platformName }) }}
		</Alert>
		<Alert v-if="apiError" variant="danger">
			{{ t(m.apiDown.id, { platform: platformName }) }}
		</Alert>

		<div
			class="flex min-h-80 items-center justify-center overflow-x-auto rounded-lg border border-border bg-surface-2 p-6 transition-opacity"
			:class="loading && previewSrc ? 'opacity-60' : ''"
		>
			<a v-if="previewSrc" :href="targetUrl" target="_blank" rel="noopener">
				<img :src="previewSrc" :alt="t(m.imageAlt.id)" class="max-w-full" />
			</a>
			<div v-else class="flex flex-col items-center gap-2 text-center text-muted">
				<LoaderCircle v-if="loading" class="size-6 animate-spin" aria-hidden="true" />
				<ImageIcon v-else class="size-6" aria-hidden="true" />
				<span class="text-sm">{{ t(m.placeholder.id) }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Image as ImageIcon, LoaderCircle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'
import Alert from '../ui/Alert.vue'

defineProps<{
	loading: boolean
	apiSlow: boolean
	apiError: boolean
	previewSrc: string | null
	targetUrl: string
	platformName: string
}>()

const { t } = useI18n()
const m = defineMessages({
	placeholder: { id: 'preview.placeholder', defaultMessage: 'Your embed will appear here' },
	imageAlt: { id: 'preview.imageAlt', defaultMessage: 'Preview' },
	apiSlow: {
		id: 'warning.apiSlow',
		defaultMessage: 'The {platform} API is responding slowly. Embeds may take longer to load.',
	},
	apiDown: { id: 'error.apiDown', defaultMessage: 'The {platform} API is currently down.' },
})
</script>
