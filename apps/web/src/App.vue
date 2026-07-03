<template>
	<div class="app-grid-bg flex min-h-screen flex-col items-center px-4 pt-10 pb-6 sm:px-6">
		<div class="border-border bg-surface-2 w-full max-w-300 rounded-2xl border p-4 lg:p-8">
			<AppHeader />

			<div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
				<div class="space-y-4">
					<ConfigurationPanel />
					<CustomizationPanel v-model:expanded="customizationExpanded" />
				</div>

				<div class="flex flex-col gap-4">
					<PreviewPanel
						:loading="preview.loading.value"
						:generation-time="preview.generationTime.value"
						:api-slow="preview.apiSlow.value"
						:api-error="preview.apiError.value"
						:preview-src="preview.previewSrc.value"
						:target-url="targetUrl"
						:platform-name="builder.platformConfig.value.name"
					/>

					<OutputBlock
						:label="t(m.markdown.id)"
						:text="markdownText"
						:placeholder="t(m.markdownPlaceholder.id)"
					/>
					<OutputBlock
						:label="t(m.html.id)"
						:text="htmlText"
						:placeholder="t(m.htmlPlaceholder.id)"
					/>
					<OutputBlock :label="t(m.url.id)" :text="urlText" :placeholder="t(m.urlPlaceholder.id)" />

					<div class="flex justify-end">
						<OutputActions @reset="onReset" />
					</div>
				</div>
			</div>
		</div>

		<AppFooter />
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ConfigurationPanel from './components/builder/ConfigurationPanel.vue'
import CustomizationPanel from './components/builder/CustomizationPanel.vue'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import OutputActions from './components/preview/OutputActions.vue'
import OutputBlock from './components/preview/OutputBlock.vue'
import PreviewPanel from './components/preview/PreviewPanel.vue'
import { EmbedBuilderKey, useEmbedBuilder } from './composables/useEmbedBuilder'
import { useEmbedPreview } from './composables/useEmbedPreview'
import { defineMessages } from './helpers/i18n'
import { debounce } from './lib/debounce'

const { t } = useI18n()

const builder = useEmbedBuilder()
const preview = useEmbedPreview()
provide(EmbedBuilderKey, builder)

const customizationExpanded = ref(false)

const m = defineMessages({
	markdown: { id: 'section.markdown', defaultMessage: 'Markdown' },
	html: { id: 'section.html', defaultMessage: 'HTML' },
	url: { id: 'section.url', defaultMessage: 'URL' },
	markdownPlaceholder: {
		id: 'output.markdownPlaceholder',
		defaultMessage: 'Your markdown code will appear here',
	},
	htmlPlaceholder: {
		id: 'output.htmlPlaceholder',
		defaultMessage: 'Your HTML code will appear here',
	},
	urlPlaceholder: { id: 'output.urlPlaceholder', defaultMessage: 'Your URL will appear here' },
})

const targetUrl = computed(() => preview.metaUrl.value || builder.targetUrlFallback.value)

const markdownText = computed(() => {
	if (!builder.embedUrl.value) return ''
	const alt = preview.metaName.value || builder.identifier.value
	return `[![${alt}](${builder.embedUrl.value})](${targetUrl.value})`
})

const htmlText = computed(() => {
	if (!builder.embedUrl.value) return ''
	const alt = preview.metaName.value || builder.identifier.value
	return `<a href="${targetUrl.value}"><img src="${builder.embedUrl.value}" alt="${alt}" /></a>`
})

const urlText = computed(() => {
	if (!builder.embedUrl.value) return ''
	const url = builder.embedUrl.value
	return `${url}${url.includes('?') ? '&' : '?'}timestamp=${Date.now()}`
})

function syncNow() {
	builder.updateBrowserUrl()
	void preview.generate(
		builder.embedUrl.value,
		builder.selectedPlatform.value,
		builder.targetType.value,
		builder.identifier.value.trim(),
	)
}
const debouncedSync = debounce(syncNow, 200)

let skipNextSync = false
watch(builder.configSnapshot, () => {
	if (skipNextSync) {
		skipNextSync = false
		return
	}
	debouncedSync()
})

function onReset() {
	builder.resetToDefaults()
	preview.reset()
}

onMounted(async () => {
	skipNextSync = true
	customizationExpanded.value = builder.loadFromUrl()
	syncNow()
	await nextTick()
	skipNextSync = false
})
</script>

<style scoped>
.app-grid-bg {
	background-color: var(--color-surface-1);
	background-image:
		linear-gradient(var(--color-grid-minor) 1px, transparent 1px),
		linear-gradient(90deg, var(--color-grid-minor) 1px, transparent 1px);
	background-size: 16px 16px;
	background-position: center;
}
</style>
