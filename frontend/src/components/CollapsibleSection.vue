<template>
	<div class="bg-section-bg border border-border-dark rounded-xl px-4 py-2 mb-4">
		<button
			class="w-full flex items-center justify-between bg-transparent text-text-secondary py-2 px-0 text-sm font-semibold border-none cursor-pointer"
			@click="expanded = !expanded"
		>
			<h2 class="text-text-secondary text-2xl font-semibold">{{ title }}</h2>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="transition-transform duration-200"
				:class="{ 'rotate-180': expanded }"
			>
				<path d="m6 9 6 6 6-6" />
			</svg>
		</button>
		<div v-show="expanded" class="mt-0">
			<slot />
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	title: String,
	startExpanded: { type: Boolean, default: false },
})

const expanded = ref(props.startExpanded)
</script>
