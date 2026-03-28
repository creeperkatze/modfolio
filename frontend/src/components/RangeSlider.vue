<template>
	<div class="mb-2">
		<div class="flex justify-between items-center mb-2">
			<h3 class="text-text-secondary text-base font-semibold">{{ label }}</h3>
			<span class="dynamic-color text-base font-bold">{{ modelValue }}</span>
		</div>
		<input
			type="range"
			:value="modelValue"
			:min="min"
			:max="max"
			class="w-full"
			@input="$emit('update:modelValue', Number($event.target.value))"
		/>
	</div>
</template>

<script setup>
defineProps({
	label: String,
	modelValue: Number,
	min: { type: Number, default: 1 },
	max: { type: Number, default: 10 },
})
defineEmits(['update:modelValue'])
</script>
