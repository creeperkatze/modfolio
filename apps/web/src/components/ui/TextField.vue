<template>
	<div>
		<label
			class="font-mono text-text-muted mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.12em] uppercase"
			>{{ label }}</label
		>
		<input
			v-model="model"
			type="text"
			:placeholder="placeholder"
			class="text-input bg-surface-4 border-border text-text-bright w-full rounded border px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-100 focus:border-(--platform-color)"
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

<style scoped>
.text-input {
	color-scheme: var(--native-color-scheme, dark);
}

.text-input:-webkit-autofill,
.text-input:-webkit-autofill:hover,
.text-input:-webkit-autofill:focus,
.text-input:-webkit-autofill:active {
	-webkit-box-shadow: 0 0 0px 1000px var(--color-surface-4) inset !important;
	-webkit-text-fill-color: var(--color-text-bright) !important;
}
</style>
