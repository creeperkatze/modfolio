<template>
	<div
		class="flex min-h-screen justify-center bg-surface-2 px-4 py-6 sm:px-6 lg:py-10"
		:style="{ '--color-accent': '#' + builder.platformConfig.value.defaultColor }"
	>
		<div class="flex w-full max-w-300 flex-col gap-6">
			<AppHeader />

			<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
				<main class="flex flex-col gap-8 rounded-xl border border-border bg-surface-1 p-4 lg:p-6">
					<CardSection :title="t(m.configuration.id)">
						<template #action>
							<Button size="sm" @click="onReset">
								<RotateCcw class="size-3.5" aria-hidden="true" />
								{{ t(m.reset.id) }}
							</Button>
						</template>
						<EmbedSettings />
					</CardSection>
					<CardSection :title="t(m.customization.id)">
						<CustomizationSettings />
					</CardSection>
				</main>

				<aside
					class="flex flex-col gap-8 rounded-xl border border-border bg-surface-1 p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:p-6"
				>
					<CardSection :title="t(m.preview.id)">
						<PreviewPanel
							:loading="preview.loading.value"
							:api-slow="preview.apiSlow.value"
							:api-error="preview.apiError.value"
							:preview-src="preview.previewSrc.value"
							:target-url="targetUrl"
							:platform-name="builder.platformConfig.value.name"
						/>
					</CardSection>
					<CardSection :title="t(m.embedCode.id)">
						<div class="flex flex-col gap-2">
							<OutputBlock
								:icon="FileCode"
								:label="t(m.markdown.id)"
								:text="markdownText"
								:placeholder="t(m.markdownPlaceholder.id)"
							/>
							<OutputBlock
								:icon="Code"
								:label="t(m.html.id)"
								:text="htmlText"
								:placeholder="t(m.htmlPlaceholder.id)"
							/>
							<OutputBlock
								:icon="Link"
								:label="t(m.url.id)"
								:text="urlText"
								:placeholder="t(m.urlPlaceholder.id)"
							/>
						</div>
					</CardSection>
				</aside>
			</div>

			<AppFooter />
		</div>
	</div>
</template>

<script setup lang="ts">
import { Code, FileCode, Link, RotateCcw } from '@lucide/vue'
import { computed, nextTick, onMounted, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomizationSettings from './components/builder/CustomizationSettings.vue'
import EmbedSettings from './components/builder/EmbedSettings.vue'
import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import CardSection from './components/layout/CardSection.vue'
import OutputBlock from './components/preview/OutputBlock.vue'
import PreviewPanel from './components/preview/PreviewPanel.vue'
import Button from './components/ui/Button.vue'
import { EmbedBuilderKey, useEmbedBuilder } from './composables/useEmbedBuilder'
import { useEmbedPreview } from './composables/useEmbedPreview'
import { defineMessages } from './helpers/i18n'
import { debounce } from './lib/debounce'

const { t } = useI18n()

const builder = useEmbedBuilder()
const preview = useEmbedPreview()
provide(EmbedBuilderKey, builder)

const m = defineMessages({
	configuration: { id: 'section.configuration', defaultMessage: 'Configuration' },
	customization: { id: 'section.customization', defaultMessage: 'Customization' },
	reset: { id: 'action.reset', defaultMessage: 'Reset' },
	preview: { id: 'section.preview', defaultMessage: 'Preview' },
	embedCode: { id: 'section.embedCode', defaultMessage: 'Embed code' },
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
	builder.loadFromUrl()
	syncNow()
	await nextTick()
	skipNextSync = false
})
</script>
