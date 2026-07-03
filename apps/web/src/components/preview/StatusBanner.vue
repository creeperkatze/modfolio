<template>
	<div class="banner" :class="`banner-${variant}`">
		<AlertTriangle v-if="variant === 'warning'" class="size-[18px] shrink-0" aria-hidden="true" />
		<CircleAlert v-else class="size-[18px] shrink-0" aria-hidden="true" />
		<span><slot /></span>
	</div>
</template>

<script setup lang="ts">
import { AlertTriangle, CircleAlert } from '@lucide/vue'

withDefaults(
	defineProps<{
		variant?: 'warning' | 'error'
	}>(),
	{ variant: 'warning' },
)
</script>

<style scoped>
.banner {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.375rem;
	border-width: 1px;
	border-style: solid;
	padding: 0.5rem 0.75rem;
	font-size: 0.8125rem;
}

.banner-warning {
	background-color: color-mix(in srgb, var(--color-yellow) 10%, transparent);
	border-color: color-mix(in srgb, var(--color-yellow) 30%, transparent);
	color: var(--color-yellow);
}

.banner-error {
	background-color: color-mix(in srgb, var(--color-red) 10%, transparent);
	border-color: color-mix(in srgb, var(--color-red) 30%, transparent);
	color: var(--color-red);
}
</style>
