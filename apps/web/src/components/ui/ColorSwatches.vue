<script setup lang="ts">
import { Pipette } from '@lucide/vue'
import { computed } from 'vue'

import type { ColorOption, ColorValue } from '../../platforms'

const props = defineProps<{
	modelValue: ColorValue
	presets: ColorOption[]
	customLabel: string
}>()

const emit = defineEmits<{
	'update:modelValue': [value: ColorValue]
}>()

const isCustom = computed(
	() => props.modelValue !== null && !props.presets.some((c) => c.value === props.modelValue),
)

const CHECKERBOARD = {
	backgroundImage:
		'linear-gradient(45deg, #a1a1aa 25%, transparent 25%), linear-gradient(-45deg, #a1a1aa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #a1a1aa 75%), linear-gradient(-45deg, transparent 75%, #a1a1aa 75%)',
	backgroundColor: '#fff',
	backgroundSize: '10px 10px',
	backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
}

function swatchStyle(color: ColorOption) {
	return color.value === null ? CHECKERBOARD : { backgroundColor: `#${color.value}` }
}

function ringClass(selected: boolean) {
	return selected
		? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-3'
		: 'hover:ring-2 hover:ring-border hover:ring-offset-2 hover:ring-offset-surface-3'
}
</script>

<template>
	<div class="flex flex-wrap gap-2">
		<button
			v-for="color in presets"
			:key="String(color.value)"
			type="button"
			class="size-7 shrink-0 cursor-pointer rounded-md border border-primary/10 transition-shadow"
			:class="ringClass(modelValue === color.value)"
			:style="swatchStyle(color)"
			:title="color.name"
			:aria-label="color.name"
			:aria-pressed="modelValue === color.value"
			@click="emit('update:modelValue', color.value)"
		/>
		<label
			class="relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border transition-shadow"
			:class="ringClass(isCustom)"
			:style="isCustom ? { backgroundColor: `#${modelValue}` } : undefined"
			:title="customLabel"
		>
			<Pipette
				class="size-3.5"
				:class="isCustom ? 'text-white mix-blend-difference' : 'text-secondary'"
				aria-hidden="true"
			/>
			<input
				type="color"
				:value="'#' + (modelValue || 'ffffff')"
				:aria-label="customLabel"
				class="absolute inset-0 size-full cursor-pointer opacity-0"
				@input="emit('update:modelValue', ($event.target as HTMLInputElement).value.slice(1))"
			/>
		</label>
	</div>
</template>
