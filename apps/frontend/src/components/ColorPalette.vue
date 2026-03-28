<template>
	<div>
		<h3 class="text-text-secondary text-base font-semibold mb-1">{{ label }}</h3>
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex flex-wrap gap-2">
				<button
					v-for="color in presetColors"
					:key="String(color.value)"
					class="color-btn"
					:class="{ 'color-btn-selected': modelValue === color.value }"
					:style="colorButtonStyle(color)"
					:title="color.name"
					@click="$emit('update:modelValue', color.value)"
				/>
			</div>

			<div
				class="color-btn relative flex items-center justify-center overflow-hidden border-2 border-border-dark"
				:class="{ 'color-btn-selected': isCustom }"
				:style="{ background: customPickerBg }"
			>
				<input
					type="color"
					:value="'#' + (modelValue || 'ffffff')"
					class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					@input="onCustomColor"
				/>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="pointer-events-none text-text-secondary"
				>
					<path
						d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
					/>
					<path d="m15 5 4 4" />
				</svg>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	label: String,
	modelValue: [String, null],
	presetColors: Array,
})

const emit = defineEmits(['update:modelValue'])

const isCustom = computed(() => {
	if (props.modelValue === null) return false
	return !props.presetColors.some((c) => c.value === props.modelValue)
})

const customPickerBg = computed(() => {
	if (isCustom.value && props.modelValue) return `#${props.modelValue}`
	if (props.modelValue) return `#${props.modelValue}`
	return 'transparent'
})

function colorButtonStyle(color) {
	if (color.value === null) {
		return {
			background: `
                linear-gradient(45deg, #ccc 25%, transparent 25%),
                linear-gradient(-45deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(-45deg, transparent 75%, #ccc 75%)
            `,
			backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
			backgroundSize: '20px 20px',
		}
	}
	return { background: `#${color.value}` }
}

function onCustomColor(e) {
	emit('update:modelValue', e.target.value.substring(1))
}
</script>
