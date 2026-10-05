<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
	icon?: Component
	label: string
	description?: string
	labelFor?: string
}>()

defineSlots<{
	default?: () => unknown
	below?: () => unknown
}>()
</script>

<template>
	<div class="flex flex-col gap-2.5 rounded-lg border border-border bg-surface-3 px-3 py-2">
		<div class="flex min-w-0 items-center gap-3">
			<component :is="icon" v-if="icon" :size="18" class="shrink-0 text-secondary" />
			<div class="min-w-0 flex-1">
				<component :is="labelFor ? 'label' : 'p'" :for="labelFor" class="block text-sm font-medium">
					{{ label }}
				</component>
				<p v-if="description" class="mt-0.5 text-xs text-secondary">{{ description }}</p>
			</div>
			<slot />
		</div>
		<div v-if="$slots.below" :class="icon ? 'ps-7.5' : ''">
			<slot name="below" />
		</div>
	</div>
</template>
