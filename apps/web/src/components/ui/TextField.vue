<template>
	<div>
		<label class="label-tag mb-1.5 block">{{ label }}</label>
		<input
			v-model="model"
			type="text"
			:placeholder="placeholder"
			class="field-input"
			@input="$emit('input', $event)"
			@paste="$emit('paste', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	label: string
	placeholder?: string
}>()

const model = defineModel<string>({ default: '' })

defineEmits<{
	input: [Event]
	paste: [ClipboardEvent]
}>()
</script>
