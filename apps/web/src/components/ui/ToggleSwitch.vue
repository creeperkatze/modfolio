<template>
	<label class="flex cursor-pointer items-center gap-2.5 py-1 select-none">
		<input
			type="checkbox"
			:checked="modelValue"
			class="toggle-checkbox bg-surface-4 border-border size-4.5 shrink-0 cursor-pointer appearance-none rounded-sm border-2 p-0"
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

<style scoped>
.toggle-checkbox {
	position: relative;
}

.toggle-checkbox:checked {
	background-color: var(--platform-color) !important;
	border-color: var(--platform-color) !important;
}

.toggle-checkbox:checked::after {
	content: '';
	position: absolute;
	left: 50%;
	top: 50%;
	width: 6px;
	height: 12px;
	border: solid var(--platform-color-contrast);
	border-width: 0 2.5px 2.5px 0;
	transform: translate(-50%, -50%) rotate(45deg);
}
</style>
