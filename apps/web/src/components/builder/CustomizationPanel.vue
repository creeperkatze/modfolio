<template>
	<CollapsiblePanel v-model:expanded="expanded" :title="t(m.title.id)">
		<ToggleSwitch
			v-if="builder.showProjectsVisible.value"
			v-model="builder.showProjects.value"
			:label="t(m.showProjects.id)"
		/>
		<RangeSlider
			v-if="builder.showProjectsVisible.value && builder.showProjects.value"
			v-model="builder.maxProjects.value"
			:label="t(m.maxProjects.id)"
			:max="CARD_LIMITS.MAX_COUNT"
		/>

		<ToggleSwitch
			v-if="builder.showVersionsVisible.value"
			v-model="builder.showVersions.value"
			:label="versionsLabel"
		/>
		<RangeSlider
			v-if="builder.showVersionsVisible.value && builder.showVersions.value"
			v-model="builder.maxVersions.value"
			:label="maxVersionsLabel"
			:max="CARD_LIMITS.MAX_COUNT"
		/>

		<ToggleSwitch
			v-if="builder.relativeTimeVisible.value"
			v-model="builder.relativeTime.value"
			:label="t(m.relativeTime.id)"
		/>
		<ToggleSwitch
			v-if="builder.sparklinesVisible.value"
			v-model="builder.showSparklines.value"
			:label="t(m.sparklines.id)"
		/>
		<ToggleSwitch
			v-if="builder.sparklinesVisible.value"
			v-model="builder.showDownloadBars.value"
			:label="t(m.downloadBars.id)"
		/>
		<ToggleSwitch
			v-if="builder.embedType.value === 'card'"
			v-model="builder.showSummary.value"
			:label="t(m.showSummary.id)"
		/>
		<ToggleSwitch
			v-if="builder.embedType.value === 'badge'"
			v-model="builder.showIcon.value"
			:label="t(m.showIcon.id)"
		/>
		<ToggleSwitch v-model="builder.showBorder.value" :label="t(m.showBorder.id)" />
		<ToggleSwitch v-model="builder.animations.value" :label="t(m.animations.id)" />

		<ColorSwatchPicker
			:label="t(m.accentColor.id)"
			:model-value="builder.selectedColor.value"
			:preset-colors="builder.accentPresets.value"
			@update:model-value="(v) => v !== null && (builder.selectedColor.value = v)"
		/>

		<div>
			<ColorSwatchPicker
				:label="t(m.bgColor.id)"
				:model-value="builder.selectedBgColor.value"
				:preset-colors="BG_COLORS"
				@update:model-value="(v) => (builder.selectedBgColor.value = v)"
			/>
			<StatusBanner v-if="builder.selectedBgColor.value !== null" class="mt-2">
				{{ t(m.transparentHint.id) }}
			</StatusBanner>
		</div>
	</CollapsiblePanel>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { EmbedBuilderKey } from '../../composables/useEmbedBuilder'
import { defineMessages } from '../../helpers/i18n'
import { BG_COLORS, CARD_LIMITS } from '../../platforms'
import StatusBanner from '../preview/StatusBanner.vue'
import CollapsiblePanel from '../ui/CollapsiblePanel.vue'
import ColorSwatchPicker from '../ui/ColorSwatchPicker.vue'
import RangeSlider from '../ui/RangeSlider.vue'
import ToggleSwitch from '../ui/ToggleSwitch.vue'

const builder = inject(EmbedBuilderKey)!

const expanded = defineModel<boolean>('expanded', { default: false })

const { t } = useI18n()

const m = defineMessages({
	title: { id: 'section.customization', defaultMessage: 'Customization' },
	showProjects: { id: 'option.showProjects', defaultMessage: 'Show Projects' },
	maxProjects: { id: 'option.maxProjects', defaultMessage: 'Max Projects' },
	showVersions: { id: 'option.showVersions', defaultMessage: 'Show Versions' },
	showFiles: { id: 'option.showFiles', defaultMessage: 'Show Files' },
	maxVersions: { id: 'option.maxVersions', defaultMessage: 'Max Versions' },
	maxFiles: { id: 'option.maxFiles', defaultMessage: 'Max Files' },
	relativeTime: { id: 'option.relativeTime', defaultMessage: 'Relative Time' },
	sparklines: { id: 'option.sparklines', defaultMessage: 'Sparkline Graphs' },
	downloadBars: { id: 'option.downloadBars', defaultMessage: 'Download Bars' },
	showIcon: { id: 'option.showIcon', defaultMessage: 'Show Platform Icon' },
	showSummary: { id: 'option.showSummary', defaultMessage: 'Show Summary' },
	showBorder: { id: 'option.showBorder', defaultMessage: 'Show Border' },
	animations: { id: 'option.animations', defaultMessage: 'Animations' },
	accentColor: { id: 'option.accentColor', defaultMessage: 'Accent Color' },
	bgColor: { id: 'option.bgColor', defaultMessage: 'Background Color' },
	transparentHint: {
		id: 'hint.transparentBg',
		defaultMessage:
			'Transparent works best in most situations, as it blends in with the background without changing its style.',
	},
})

const versionsLabel = computed(() =>
	builder.selectedPlatform.value === 'curseforge' ? t(m.showFiles.id) : t(m.showVersions.id),
)
const maxVersionsLabel = computed(() =>
	builder.selectedPlatform.value === 'curseforge' ? t(m.maxFiles.id) : t(m.maxVersions.id),
)
</script>
