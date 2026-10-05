<template>
	<div class="flex items-start justify-between gap-4 p-4">
		<div class="min-w-0">
			<h2 class="m-0 text-lg font-semibold">{{ title }}</h2>
			<p v-if="description" class="mt-1 mb-0 text-sm text-secondary">{{ description }}</p>
		</div>
		<slot />
	</div>
	<div class="border-b border-border-subtle"></div>
</template>

<script setup lang="ts">
defineProps<{
	title: string
	description?: string
}>()
</script>
