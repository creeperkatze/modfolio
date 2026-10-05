<template>
	<div
		class="flex shrink-0 gap-0.5 rounded-lg border border-border bg-surface-control p-0.5"
		role="radiogroup"
		:aria-label="t(m.label.id)"
	>
		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			role="radio"
			class="flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
			:class="
				scheme === option.value
					? 'bg-surface-hover text-primary'
					: 'text-secondary hover:text-primary'
			"
			:aria-checked="scheme === option.value"
			:title="option.label"
			:aria-label="option.label"
			@click="scheme = option.value"
		>
			<component :is="option.icon" class="size-4" aria-hidden="true" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { type ColorScheme, useColorScheme } from '../../composables/useColorScheme'
import { defineMessages } from '../../helpers/i18n'

const { t } = useI18n()
const { scheme } = useColorScheme()

const m = defineMessages({
	label: { id: 'colorScheme.label', defaultMessage: 'Color scheme' },
	auto: { id: 'colorScheme.auto', defaultMessage: 'System' },
	light: { id: 'colorScheme.light', defaultMessage: 'Light' },
	dark: { id: 'colorScheme.dark', defaultMessage: 'Dark' },
})

const options = computed<{ value: ColorScheme; label: string; icon: typeof Monitor }[]>(() => [
	{ value: 'auto', label: t(m.auto.id), icon: Monitor },
	{ value: 'light', label: t(m.light.id), icon: Sun },
	{ value: 'dark', label: t(m.dark.id), icon: Moon },
])
</script>
