<template>
	<div>
		<span
			class="font-mono text-text-muted mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.12em] uppercase"
			>{{ label }}</span
		>
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex flex-wrap gap-2">
				<button
					v-for="color in presetColors"
					:key="String(color.value)"
					type="button"
					class="size-9 shrink-0 cursor-pointer rounded-md border-2 p-0"
					:class="modelValue === color.value ? 'border-white' : 'border-border'"
					:style="colorButtonStyle(color)"
					:title="color.name"
					@click="$emit('update:modelValue', color.value)"
				/>
			</div>

			<div
				class="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border-2"
				:class="isCustom ? 'border-white' : 'border-border'"
				:style="{ background: customPickerBg }"
			>
				<input
					type="color"
					:value="'#' + (modelValue || 'ffffff')"
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					@input="onCustomColor"
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-text-secondary pointer-events-none"
				>
					<path
						d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
					/>
					<path d="m15 5 4 4" />
				</svg>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { ColorOption, ColorValue } from '../../platforms'

const props = defineProps<{
	label?: string
	modelValue: ColorValue
	presetColors: ColorOption[]
}>()

const emit = defineEmits<{
	'update:modelValue': [value: ColorValue]
}>()

const isCustom = computed(() => {
	if (props.modelValue === null) return false
	return !props.presetColors.some((c) => c.value === props.modelValue)
})

const customPickerBg = computed(() => {
	if (props.modelValue) return `#${props.modelValue}`
	return 'transparent'
})

function colorButtonStyle(color: ColorOption) {
	if (color.value === null) {
		return {
			background: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
			backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
			backgroundSize: '20px 20px',
		}
	}
	return { background: `#${color.value}` }
}

function onCustomColor(e: Event) {
	const target = e.target as HTMLInputElement
	emit('update:modelValue', target.value.substring(1))
}
</script>
