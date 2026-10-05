<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
	defineProps<{
		modelValue: number
		min?: number
		max?: number
		step?: number
	}>(),
	{ min: 1, max: 10, step: 1 },
)

defineEmits<{
	'update:modelValue': [value: number]
}>()

const fill = computed(() => ((props.modelValue - props.min) / (props.max - props.min)) * 100)
</script>

<template>
	<div class="flex items-center gap-3">
		<input
			v-bind="$attrs"
			type="range"
			:min="min"
			:max="max"
			:step="step"
			:value="modelValue"
			class="slider min-w-0 flex-1 cursor-pointer"
			:style="{ '--fill': `${fill}%` }"
			@input="$emit('update:modelValue', +($event.target as HTMLInputElement).value)"
		/>
		<span class="w-5 shrink-0 text-end text-sm font-medium tabular-nums">{{ modelValue }}</span>
	</div>
</template>

<style scoped>
.slider {
	appearance: none;
	height: 1rem;
	background: transparent;
	--track: linear-gradient(
		to right,
		var(--color-accent) var(--fill),
		var(--color-surface-control) var(--fill)
	);
}

.slider:dir(rtl) {
	--track: linear-gradient(
		to left,
		var(--color-accent) var(--fill),
		var(--color-surface-control) var(--fill)
	);
}

.slider:focus-visible {
	outline: none;
}

.slider::-webkit-slider-runnable-track {
	box-sizing: border-box;
	height: 0.5625rem;
	border: 1px solid var(--color-border);
	border-radius: 9999px;
	background: var(--track);
}

.slider::-moz-range-track {
	box-sizing: border-box;
	height: 0.5625rem;
	border: 1px solid var(--color-border);
	border-radius: 9999px;
	background: var(--track);
}

.slider::-webkit-slider-thumb {
	appearance: none;
	margin-top: calc((0.5625rem - 2px - 1rem) / 2);
	width: 1rem;
	height: 1rem;
	border: none;
	border-radius: 9999px;
	background: var(--color-primary);
	transition: background-color 150ms;
}

.slider::-moz-range-thumb {
	width: 1rem;
	height: 1rem;
	border: none;
	border-radius: 9999px;
	background: var(--color-primary);
	transition: background-color 150ms;
}

.slider:hover::-webkit-slider-thumb {
	background: color-mix(in srgb, var(--color-primary) 75%, var(--color-surface-3));
}

.slider:hover::-moz-range-thumb {
	background: color-mix(in srgb, var(--color-primary) 75%, var(--color-surface-3));
}

.slider:focus-visible::-webkit-slider-thumb {
	box-shadow: 0 0 0 2px var(--color-accent);
}

.slider:focus-visible::-moz-range-thumb {
	box-shadow: 0 0 0 2px var(--color-accent);
}
</style>
