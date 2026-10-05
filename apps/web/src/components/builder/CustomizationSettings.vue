<template>
	<div class="flex flex-col gap-2">
		<OptionToggle
			v-if="builder.showProjectsVisible.value"
			v-model="builder.showProjects.value"
			:icon="Layers"
			:label="t(m.showProjects.id)"
			:description="t(m.showProjectsHint.id)"
		>
			<template #below>
				<Slider
					v-model="builder.maxProjects.value"
					:max="CARD_LIMITS.MAX_COUNT"
					:aria-label="t(m.maxProjects.id)"
				/>
			</template>
		</OptionToggle>

		<OptionToggle
			v-if="builder.showVersionsVisible.value"
			v-model="builder.showVersions.value"
			:icon="History"
			:label="isCurseforge ? t(m.showFiles.id) : t(m.showVersions.id)"
			:description="isCurseforge ? t(m.showFilesHint.id) : t(m.showVersionsHint.id)"
		>
			<template #below>
				<Slider
					v-model="builder.maxVersions.value"
					:max="CARD_LIMITS.MAX_COUNT"
					:aria-label="isCurseforge ? t(m.maxFiles.id) : t(m.maxVersions.id)"
				/>
			</template>
		</OptionToggle>

		<OptionToggle
			v-if="builder.relativeTimeVisible.value"
			v-model="builder.relativeTime.value"
			:icon="Clock"
			:label="t(m.relativeTime.id)"
			:description="t(m.relativeTimeHint.id)"
		/>
		<OptionToggle
			v-if="builder.sparklinesVisible.value"
			v-model="builder.showSparklines.value"
			:icon="TrendingUp"
			:label="t(m.sparklines.id)"
			:description="t(m.sparklinesHint.id)"
		/>
		<OptionToggle
			v-if="builder.sparklinesVisible.value"
			v-model="builder.showDownloadBars.value"
			:icon="ChartColumn"
			:label="t(m.downloadBars.id)"
			:description="t(m.downloadBarsHint.id)"
		/>
		<OptionToggle
			v-if="builder.embedType.value === 'card'"
			v-model="builder.showSummary.value"
			:icon="TextAlignStart"
			:label="t(m.showSummary.id)"
			:description="t(m.showSummaryHint.id)"
		/>
		<OptionToggle
			v-if="builder.embedType.value === 'badge'"
			v-model="builder.showIcon.value"
			:icon="Image"
			:label="t(m.showIcon.id)"
			:description="t(m.showIconHint.id)"
		/>
		<OptionToggle
			v-model="builder.showBorder.value"
			:icon="Square"
			:label="t(m.showBorder.id)"
			:description="t(m.showBorderHint.id)"
		/>
		<OptionToggle
			v-model="builder.animations.value"
			:icon="Sparkles"
			:label="t(m.animations.id)"
			:description="t(m.animationsHint.id)"
		/>

		<OptionRow :icon="Palette" :label="t(m.accentColor.id)" :description="t(m.accentColorHint.id)">
			<template #below>
				<ColorSwatches
					:model-value="builder.selectedColor.value"
					:presets="builder.accentPresets.value"
					:custom-label="t(m.customColor.id)"
					@update:model-value="(v) => v !== null && (builder.selectedColor.value = v)"
				/>
			</template>
		</OptionRow>

		<OptionRow :icon="PaintBucket" :label="t(m.bgColor.id)" :description="t(m.transparentHint.id)">
			<template #below>
				<ColorSwatches
					v-model="builder.selectedBgColor.value"
					:presets="BG_COLORS"
					:custom-label="t(m.customColor.id)"
				/>
			</template>
		</OptionRow>
	</div>
</template>

<script setup lang="ts">
import {
	ChartColumn,
	Clock,
	History,
	Image,
	Layers,
	PaintBucket,
	Palette,
	Sparkles,
	Square,
	TextAlignStart,
	TrendingUp,
} from '@lucide/vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { EmbedBuilderKey } from '../../composables/useEmbedBuilder'
import { defineMessages } from '../../helpers/i18n'
import { BG_COLORS, CARD_LIMITS } from '../../platforms'
import OptionRow from '../options/OptionRow.vue'
import OptionToggle from '../options/OptionToggle.vue'
import ColorSwatches from '../ui/ColorSwatches.vue'
import Slider from '../ui/Slider.vue'

const builder = inject(EmbedBuilderKey)!

const { t } = useI18n()

const m = defineMessages({
	showProjects: { id: 'option.showProjects', defaultMessage: 'Show Projects' },
	showProjectsHint: { id: 'hint.showProjects', defaultMessage: 'List projects on the card' },
	maxProjects: { id: 'option.maxProjects', defaultMessage: 'Max Projects' },
	showVersions: { id: 'option.showVersions', defaultMessage: 'Show Versions' },
	showVersionsHint: { id: 'hint.showVersions', defaultMessage: 'List the latest versions' },
	showFiles: { id: 'option.showFiles', defaultMessage: 'Show Files' },
	showFilesHint: { id: 'hint.showFiles', defaultMessage: 'List the latest files' },
	maxVersions: { id: 'option.maxVersions', defaultMessage: 'Max Versions' },
	maxFiles: { id: 'option.maxFiles', defaultMessage: 'Max Files' },
	relativeTime: { id: 'option.relativeTime', defaultMessage: 'Relative Time' },
	relativeTimeHint: { id: 'hint.relativeTime', defaultMessage: 'Show dates relative to today' },
	sparklines: { id: 'option.sparklines', defaultMessage: 'Sparkline Graphs' },
	sparklinesHint: { id: 'hint.sparklines', defaultMessage: 'Graph release activity over time' },
	downloadBars: { id: 'option.downloadBars', defaultMessage: 'Download Bars' },
	downloadBarsHint: {
		id: 'hint.downloadBars',
		defaultMessage: 'Compare project downloads with bars',
	},
	showIcon: { id: 'option.showIcon', defaultMessage: 'Show Platform Icon' },
	showIconHint: { id: 'hint.showIcon', defaultMessage: 'Show the platform logo on the badge' },
	showSummary: { id: 'option.showSummary', defaultMessage: 'Show Summary' },
	showSummaryHint: { id: 'hint.showSummary', defaultMessage: 'Show the description text' },
	showBorder: { id: 'option.showBorder', defaultMessage: 'Show Border' },
	showBorderHint: { id: 'hint.showBorder', defaultMessage: 'Draw a border around the embed' },
	animations: { id: 'option.animations', defaultMessage: 'Animations' },
	animationsHint: { id: 'hint.animations', defaultMessage: 'Animate the embed as it loads' },
	accentColor: { id: 'option.accentColor', defaultMessage: 'Accent Color' },
	accentColorHint: { id: 'hint.accentColor', defaultMessage: 'Used for highlights and graphs' },
	bgColor: { id: 'option.bgColor', defaultMessage: 'Background Color' },
	customColor: { id: 'option.customColor', defaultMessage: 'Custom color' },
	transparentHint: {
		id: 'hint.transparentBg',
		defaultMessage:
			'Transparent works best in most situations, as it blends in with the background without changing its style.',
	},
})

const isCurseforge = computed(() => builder.selectedPlatform.value === 'curseforge')
</script>
