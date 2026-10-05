<script setup lang="ts">
import type { Component } from 'vue'

import Toggle from '../ui/Toggle.vue'
import OptionRow from './OptionRow.vue'

defineProps<{
	icon?: Component
	label: string
	description?: string
}>()

const model = defineModel<boolean>({ required: true })

defineSlots<{
	below?: () => unknown
}>()
</script>

<template>
	<OptionRow :icon="icon" :label="label" :description="description">
		<Toggle v-model="model" :aria-label="label" />
		<template v-if="$slots.below && model" #below>
			<slot name="below" />
		</template>
	</OptionRow>
</template>
