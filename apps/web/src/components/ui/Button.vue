<template>
	<button type="button" class="btn" :class="`btn-${variant}`" :disabled="disabled">
		<slot />
	</button>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		variant?: 'primary' | 'secondary'
		disabled?: boolean
	}>(),
	{
		variant: 'primary',
	},
)
</script>

<style scoped>
.btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	border-radius: 0.25rem;
	border: 1px solid transparent;
	font-family: var(--font-mono);
	font-size: 0.8125rem;
	font-weight: 600;
	letter-spacing: 0.02em;
	cursor: pointer;
	transition:
		filter 0.15s ease,
		opacity 0.15s ease;
}

.btn:hover:not(:disabled) {
	filter: brightness(1.12);
}

.btn-primary {
	background-color: var(--platform-color);
	color: #06060a;
}

.btn-secondary {
	background-color: var(--color-surface-4);
	color: var(--color-text-bright);
	border-color: var(--color-border);
}

.btn:disabled {
	background-color: var(--color-surface-4);
	color: var(--color-text-muted);
	opacity: 0.5;
	cursor: not-allowed;
	filter: none;
}
</style>
