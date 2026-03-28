<template>
	<div class="mb-2">
		<label class="flex items-center gap-2 cursor-pointer">
			<input
				type="checkbox"
				:checked="modelValue"
				class="dynamic-checkbox !w-[18px] h-[18px] min-w-[18px] flex-shrink-0 appearance-none bg-input-bg border-2 border-text-muted rounded cursor-pointer relative p-0"
				@change="$emit('update:modelValue', $event.target.checked)"
			/>
			<span class="text-base text-text-secondary">{{ label }}</span>
		</label>
	</div>
</template>

<script setup>
defineProps({
	label: String,
	modelValue: Boolean,
})
defineEmits(['update:modelValue'])
</script>
