<template>
	<Button variant="secondary" @click="$emit('reset')">
		<span>{{ t(m.reset.id) }}</span>
		<RotateCcw class="size-4" />
	</Button>
</template>

<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'
import Button from '../ui/Button.vue'

defineEmits<{ reset: [] }>()

const { t } = useI18n()
const m = defineMessages({
	reset: { id: 'action.reset', defaultMessage: 'Reset' },
})
</script>
