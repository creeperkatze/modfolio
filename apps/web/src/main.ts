import './style.css'

import { createApp } from 'vue'

import App from './App.vue'
import { detectBrowserLocale, i18n } from './helpers/i18n'

const app = createApp(App)
app.use(i18n)

i18n.global.locale.value = localStorage.getItem('modfolio-locale') || detectBrowserLocale()

app.mount('#app')
