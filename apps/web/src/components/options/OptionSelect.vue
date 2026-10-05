<script setup lang="ts" generic="T extends { value: string; label: string }">
import type { Component } from 'vue'

import Dropdown from '../ui/Dropdown.vue'
import OptionRow from './OptionRow.vue'

defineProps<{
	icon?: Component
	label: string
	description?: string
	options: T[]
}>()

const model = defineModel<string>({ required: true })

defineEmits<{
	change: []
}>()
</script>

<template>
	<OptionRow :icon="icon" :label="label" :description="description">
		<Dropdown
			class="w-40 shrink-0"
			:model-value="model"
			:options="options"
			@update:model-value="
				(value) => {
					model = value
					$emit('change')
				}
			"
		/>
	</OptionRow>
</template>
