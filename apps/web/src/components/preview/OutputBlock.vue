<template>
	<div>
		<h2 class="font-display text-text-secondary mb-2 text-sm font-bold tracking-wide uppercase">
			{{ label }}
		</h2>
		<div class="flex items-center gap-2">
			<div
				class="bg-surface-0 border-border flex-1 rounded-lg border p-3 font-mono text-xs break-all"
				:class="text ? 'text-text-bright' : 'text-text-muted'"
			>
				{{ text || placeholder }}
			</div>
			<Button variant="secondary" :disabled="!text" :title="label" @click="copy(text)">
				<Check v-if="copied" class="size-4" />
				<Copy v-else class="size-4" />
			</Button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'

import { useClipboard } from '../../composables/useClipboard'
import Button from '../ui/Button.vue'

defineProps<{
	label: string
	text: string
	placeholder: string
}>()

const { copied, copy } = useClipboard()
</script>
