<template>
	<div>
		<div class="mb-2 flex items-center justify-between">
			<span class="label-tag">{{ label }}</span>
			<span class="dynamic-color font-mono text-sm font-bold">{{ modelValue }}</span>
		</div>
		<input
			type="range"
			:value="modelValue"
			:min="min"
			:max="max"
			class="w-full"
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
