<template>
	<div>
		<h2 class="mb-2 flex items-center justify-between">
			<span class="font-display text-text-secondary text-sm font-bold tracking-wide uppercase">{{
				t(m.title.id)
			}}</span>
			<span class="flex items-center gap-1.5 font-mono text-xs">
				<Zap v-if="!loading && generationTime" class="text-yellow size-3.5" aria-hidden="true" />
				<Loader2 v-if="loading" class="text-yellow size-3.5 animate-spin" aria-hidden="true" />
				<span v-if="generationTime" class="text-yellow">{{ generationTime }}ms</span>
			</span>
		</h2>

		<StatusBanner v-if="apiSlow" variant="warning" class="mb-3">
			{{ t(m.apiSlow.id, { platform: platformName }) }}
		</StatusBanner>
		<StatusBanner v-if="apiError" variant="error" class="mb-3">
			{{ t(m.apiDown.id, { platform: platformName }) }}
		</StatusBanner>

		<div
			class="bg-surface-0 border-border text-text-muted flex min-h-105 items-center justify-center rounded-xl border p-4"
		>
			<span v-if="!previewSrc" class="font-mono text-sm">{{ t(m.placeholder.id) }}</span>
			<a v-else :href="targetUrl" target="_blank" rel="noopener">
				<img :src="previewSrc" :alt="t(m.imageAlt.id)" class="max-w-full" />
			</a>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Loader2, Zap } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'
import StatusBanner from './StatusBanner.vue'

defineProps<{
	loading: boolean
	generationTime: number | null
	apiSlow: boolean
	apiError: boolean
	previewSrc: string | null
	targetUrl: string
	platformName: string
}>()

const { t } = useI18n()
const m = defineMessages({
	title: { id: 'section.preview', defaultMessage: 'Preview' },
	placeholder: { id: 'preview.placeholder', defaultMessage: 'Your embed will appear here' },
	imageAlt: { id: 'preview.imageAlt', defaultMessage: 'Preview' },
	apiSlow: {
		id: 'warning.apiSlow',
		defaultMessage: 'The {platform} API is responding slowly. Embeds may take longer to load.',
	},
	apiDown: { id: 'error.apiDown', defaultMessage: 'The {platform} API is currently down.' },
})
</script>
