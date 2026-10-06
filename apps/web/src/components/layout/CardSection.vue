<script setup lang="ts">
defineProps<{
	title: string
}>()

defineSlots<{
	default?: () => unknown
	action?: () => unknown
}>()
</script>

<template>
	<section class="flex flex-col gap-3">
		<div class="flex min-h-8 items-center justify-between gap-2">
			<h2 class="m-0 text-base font-semibold">{{ title }}</h2>
			<slot name="action" />
		</div>
		<slot />
	</section>
</template>
