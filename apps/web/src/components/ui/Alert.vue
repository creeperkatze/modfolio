<script setup lang="ts">
import { CircleAlert, TriangleAlert } from '@lucide/vue'

withDefaults(defineProps<{ variant?: 'warning' | 'danger' }>(), { variant: 'warning' })
</script>

<template>
	<div
		class="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
		:class="
			variant === 'warning'
				? 'border-warning-border bg-warning-bg text-warning'
				: 'border-danger-border bg-danger-bg text-danger'
		"
		role="alert"
	>
		<TriangleAlert v-if="variant === 'warning'" class="size-4 shrink-0" aria-hidden="true" />
		<CircleAlert v-else class="size-4 shrink-0" aria-hidden="true" />
		<span><slot /></span>
	</div>
</template>
