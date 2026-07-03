import { ref, watch } from 'vue'

const STORAGE_KEY = 'modfolio-color-scheme'

export function useColorScheme() {
	const isLight = ref(document.documentElement.classList.contains('light'))

	watch(isLight, (value) => {
		document.documentElement.classList.toggle('light', value)
		localStorage.setItem(STORAGE_KEY, value ? 'light' : 'dark')
	})

	function toggle() {
		isLight.value = !isLight.value
	}

	return { isLight, toggle }
}
