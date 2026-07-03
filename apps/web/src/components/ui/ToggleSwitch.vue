<template>
	<label class="flex cursor-pointer items-center gap-2.5 py-1 select-none">
		<input
			type="checkbox"
			:checked="modelValue"
			class="dynamic-checkbox bg-surface-4 border-border size-[18px] shrink-0 cursor-pointer appearance-none rounded-sm border-2 p-0"
			@change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
		/>
		<span class="text-text-secondary text-sm font-medium">{{ label }}</span>
	</label>
</template>

<script setup lang="ts">
defineProps<{
	label?: string
	modelValue?: boolean
}>()

defineEmits<{
	'update:modelValue': [value: boolean]
}>()
</script>
