<template>
	<OptionRow :icon="icon" :label="label">
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
		<template #below>
			<code
				class="block rounded-md border border-border bg-surface-control px-3 py-2 font-mono text-sm break-all"
				:class="text ? 'text-primary' : 'text-muted'"
				>{{ text || placeholder }}</code
			>
		</template>
	</OptionRow>
</template>

<script setup lang="ts">
import { Check, Copy } from '@lucide/vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

import { useClipboard } from '../../composables/useClipboard'
import { defineMessages } from '../../helpers/i18n'
import OptionRow from '../options/OptionRow.vue'
import Button from '../ui/Button.vue'

defineProps<{
	icon: Component
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
