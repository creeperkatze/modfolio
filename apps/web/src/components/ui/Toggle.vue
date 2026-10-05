<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

defineProps<{
	modelValue: boolean
	disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const mounted = ref(false)
onMounted(() =>
	nextTick(() => {
		mounted.value = true
	}),
)
</script>

<template>
	<button
		type="button"
		role="switch"
		:aria-checked="modelValue"
		:disabled="disabled"
		class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border p-px focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
		:class="[
			modelValue ? 'border-accent bg-accent' : 'border-border bg-surface-control',
			disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
			mounted ? 'transition-colors duration-200' : '',
		]"
		@click.stop="!disabled && $emit('update:modelValue', !modelValue)"
	>
		<span
			class="pointer-events-none inline-block size-4 rounded-full shadow-sm"
			:class="[
				modelValue ? 'translate-x-4 bg-white rtl:-translate-x-4' : 'translate-x-0 bg-primary',
				mounted ? 'transition-transform duration-200' : '',
			]"
		/>
	</button>
</template>
