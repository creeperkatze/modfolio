<template>
	<div
		class="flex min-h-screen flex-col bg-surface-1 lg:h-screen lg:flex-row lg:overflow-hidden"
		:style="{ '--color-accent': '#' + builder.platformConfig.value.defaultColor }"
	>
		<AppSidebar v-model:tab="tab" :tabs="tabs" />

		<section
			class="flex flex-col border-border-subtle max-lg:border-b lg:h-screen lg:w-lg lg:shrink-0 lg:border-e xl:w-xl"
		>
			<PageHeader :title="activeTab.label" :description="activeTab.description">
				<Button size="sm" @click="onReset">
					<RotateCcw class="size-3.5" aria-hidden="true" />
					{{ t(m.reset.id) }}
				</Button>
			</PageHeader>
			<div class="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
				<EmbedSettings v-if="tab === 'configuration'" />
				<CustomizationSettings v-else />
			</div>
		</section>

		<main class="min-w-0 flex-1 lg:overflow-y-auto">
			<PageHeader :title="t(m.preview.id)" :description="t(m.previewDescription.id)" />

			<div class="flex max-w-3xl flex-col gap-6 p-4">
				<PreviewPanel
					:loading="preview.loading.value"
					:api-slow="preview.apiSlow.value"
					:api-error="preview.apiError.value"
					:preview-src="preview.previewSrc.value"
					:target-url="targetUrl"
					:platform-name="builder.platformConfig.value.name"
				/>

				<section class="flex flex-col gap-2">
					<h2 class="m-0 px-1 text-sm font-semibold">{{ t(m.embedCode.id) }}</h2>
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
				</section>
			</div>
		</main>
	</div>
</template>

<script setup lang="ts">
import { Code, FileCode, Link, Palette, RotateCcw, SlidersHorizontal } from '@lucide/vue'
import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomizationSettings from './components/builder/CustomizationSettings.vue'
import EmbedSettings from './components/builder/EmbedSettings.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import PageHeader from './components/layout/PageHeader.vue'
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
	configurationDescription: {
		id: 'app.subtitle',
		defaultMessage:
			'Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.',
	},
	customization: { id: 'section.customization', defaultMessage: 'Customization' },
	customizationDescription: {
		id: 'hint.customization',
		defaultMessage: 'Adjust how your embed looks',
	},
	reset: { id: 'action.reset', defaultMessage: 'Reset' },
	preview: { id: 'section.preview', defaultMessage: 'Preview' },
	previewDescription: {
		id: 'preview.description',
		defaultMessage: 'Updates live as you change the settings',
	},
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

type Tab = 'configuration' | 'customization'

const tab = ref<Tab>('configuration')

const tabs = computed(() => [
	{
		id: 'configuration' as const,
		label: t(m.configuration.id),
		description: t(m.configurationDescription.id),
		icon: SlidersHorizontal,
	},
	{
		id: 'customization' as const,
		label: t(m.customization.id),
		description: t(m.customizationDescription.id),
		icon: Palette,
	},
])

const activeTab = computed(() => tabs.value.find((item) => item.id === tab.value)!)

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
