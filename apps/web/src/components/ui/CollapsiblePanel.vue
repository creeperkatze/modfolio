<template>
	<div class="bg-surface-3 border-border rounded-lg border px-4 py-3">
		<button
			type="button"
			class="text-text-secondary flex w-full cursor-pointer items-center justify-between border-none bg-transparent py-1"
			@click="expanded = !expanded"
		>
			<span class="font-display text-sm font-bold tracking-wide uppercase">{{ title }}</span>
			<ChevronDown
				class="size-4 transition-transform duration-200"
				:class="{ 'rotate-180': expanded }"
			/>
		</button>
		<div
			class="grid transition-[grid-template-rows] duration-300 ease-in-out"
			:class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
		>
			<div class="overflow-hidden">
				<div class="mt-3 space-y-3" :inert="!expanded">
					<slot />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

defineProps<{
	title?: string
}>()

const expanded = defineModel<boolean>('expanded', { default: false })
</script>
