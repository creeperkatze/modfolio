import './style.css'

import { createApp } from 'vue'

import App from './App.vue'
import { detectBrowserLocale, i18n } from './helpers/i18n'

const storedScheme = localStorage.getItem('modfolio-color-scheme')
const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
if (storedScheme === 'light' || (!storedScheme && prefersLight)) {
	document.documentElement.classList.add('light')
}

const app = createApp(App)
app.use(i18n)

i18n.global.locale.value = localStorage.getItem('modfolio-locale') || detectBrowserLocale()

app.mount('#app')
