<template>
	<a
		:href="href"
		target="_blank"
		rel="noopener"
		class="group flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 no-underline transition-colors duration-150"
		:class="color ? 'card-highlight' : 'border-border bg-surface-3 hover:bg-surface-hover'"
		:style="color ? { '--c': color } : undefined"
	>
		<div class="min-w-0 flex-1">
			<div class="text-sm leading-tight font-semibold text-primary">{{ title }}</div>
			<div v-if="description" class="mt-px text-xs text-secondary">{{ description }}</div>
		</div>
		<slot name="icon" />
	</a>
</template>

<script setup lang="ts">
defineProps<{
	href: string
	title: string
	description?: string
	color?: string
}>()
</script>

<style scoped>
.card-highlight {
	background-color: color-mix(in srgb, var(--c) 8%, var(--color-surface-3));
	border-color: color-mix(in srgb, var(--c) 22%, transparent);
}

.card-highlight:hover {
	background-color: color-mix(in srgb, var(--c) 22%, var(--color-surface-3));
	border-color: color-mix(in srgb, var(--c) 60%, transparent);
}
</style>
