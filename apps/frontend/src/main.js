import './style.css'

import { createApp } from 'vue'

import App from './App.vue'
import { detectBrowserLocale, i18n } from './helpers/i18n.js'

const app = createApp(App)
app.use(i18n)

// Apply browser locale before mount
i18n.global.locale.value = detectBrowserLocale()

app.mount('#app')
