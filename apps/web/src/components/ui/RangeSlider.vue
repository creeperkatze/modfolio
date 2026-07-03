<template>
	<div>
		<div class="mb-2 flex items-center justify-between">
			<span
				class="font-mono text-text-muted text-[0.6875rem] font-semibold tracking-[0.12em] uppercase"
				>{{ label }}</span
			>
			<span class="font-mono text-(--platform-color) text-sm font-bold">{{ modelValue }}</span>
		</div>
		<input
			type="range"
			:value="modelValue"
			:min="min"
			:max="max"
			class="range-input w-full"
			@input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
		/>
	</div>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		label?: string
		modelValue?: number
		min?: number
		max?: number
	}>(),
	{
		min: 1,
		max: 10,
	},
)

defineEmits<{
	'update:modelValue': [value: number]
}>()
</script>

<style scoped>
.range-input {
	-webkit-appearance: none;
	appearance: none;
	height: 4px;
	background: var(--color-surface-4);
	border-radius: 2px;
	outline: none;
}

.range-input::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 16px;
	height: 16px;
	background: var(--platform-color);
	cursor: pointer;
	border-radius: 3px;
	transition: transform 0.15s ease;
}

.range-input::-webkit-slider-thumb:hover {
	filter: brightness(1.15);
	transform: scale(1.1);
}

.range-input::-moz-range-thumb {
	width: 16px;
	height: 16px;
	background: var(--platform-color);
	cursor: pointer;
	border-radius: 3px;
	border: none;
}

.range-input::-moz-range-thumb:hover {
	filter: brightness(1.15);
	transform: scale(1.1);
}
</style>
