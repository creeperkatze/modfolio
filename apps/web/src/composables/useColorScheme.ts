import { ref, watch } from 'vue'

export type ColorScheme = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'modfolio-color-scheme'

function readStored(): ColorScheme {
	const stored = localStorage.getItem(STORAGE_KEY)
	return stored === 'light' || stored === 'dark' ? stored : 'auto'
}

function applyColorScheme(scheme: ColorScheme) {
	if (scheme === 'auto') delete document.documentElement.dataset.theme
	else document.documentElement.dataset.theme = scheme
}

const scheme = ref<ColorScheme>(readStored())

watch(scheme, (value) => {
	applyColorScheme(value)
	if (value === 'auto') localStorage.removeItem(STORAGE_KEY)
	else localStorage.setItem(STORAGE_KEY, value)
})

export function useColorScheme() {
	return { scheme, init: () => applyColorScheme(scheme.value) }
}
