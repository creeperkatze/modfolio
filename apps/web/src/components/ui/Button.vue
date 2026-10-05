<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
	defineProps<{
		size?: 'sm' | 'md' | 'icon'
		type?: 'button' | 'submit' | 'reset'
		disabled?: boolean
		active?: boolean
	}>(),
	{
		size: 'md',
		type: 'button',
		disabled: false,
		active: false,
	},
)

const classes = computed(() => [
	'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
	props.size === 'icon' ? 'size-9 p-0' : props.size === 'sm' ? 'h-8 px-3' : 'h-9 px-3',
	props.active
		? 'border-accent bg-accent/10 text-primary'
		: 'border-border bg-surface-control text-primary enabled:hover:bg-surface-hover',
])
</script>

<template>
	<button :type="type" :disabled="disabled" :class="classes">
		<slot />
	</button>
</template>
