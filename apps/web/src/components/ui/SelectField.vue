<template>
	<div>
		<label class="label-tag mb-1.5 block">{{ label }}</label>
		<select v-model="model" class="field-input" @change="$emit('change')">
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
