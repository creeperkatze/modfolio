<template>
	<div>
		<label
			class="font-mono text-text-muted mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.12em] uppercase"
			>{{ label }}</label
		>
		<select
			v-model="model"
			class="bg-surface-4 border-border text-text-bright w-full rounded border px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-100 focus:border-(--platform-color)"
			@change="$emit('change')"
		>
			<option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
		</select>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	label: string
	options: { value: string; label: string }[]
}>()

const model = defineModel<string>({ default: '' })

defineEmits<{ change: [] }>()
</script>
