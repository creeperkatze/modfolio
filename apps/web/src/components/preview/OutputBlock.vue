<template>
	<div class="flex items-center gap-3 rounded-lg border border-border bg-surface-3 py-2 ps-3 pe-2">
		<div class="min-w-0 flex-1">
			<p class="m-0 text-xs font-medium text-secondary">{{ label }}</p>
			<code
				class="mt-0.5 block font-mono text-xs break-all"
				:class="text ? 'text-primary' : 'text-muted'"
			>
				{{ text || placeholder }}
			</code>
		</div>
		<Button
			size="icon"
			:disabled="!text"
			:title="t(m.copy.id, { label })"
			:aria-label="t(m.copy.id, { label })"
			@click="copy(text)"
		>
			<Check v-if="copied" class="size-4" aria-hidden="true" />
			<Copy v-else class="size-4" aria-hidden="true" />
		</Button>
	</div>
</template>

<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { useClipboard } from '../../composables/useClipboard'
import { defineMessages } from '../../helpers/i18n'
import Button from '../ui/Button.vue'

defineProps<{
	label: string
	text: string
	placeholder: string
}>()

const { t } = useI18n()
const m = defineMessages({
	copy: { id: 'action.copy', defaultMessage: 'Copy {label}' },
})

const { copied, copy } = useClipboard()
</script>
