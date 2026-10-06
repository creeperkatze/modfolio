<template>
	<header class="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 lg:p-6">
		<div class="flex items-center justify-between gap-3">
			<a href="/" class="min-w-0 text-primary no-underline">
				<h1 class="sr-only">Modfolio</h1>
				<Logo class="h-8 w-auto" role="img" aria-label="Modfolio" />
			</a>
			<div class="flex items-center gap-2">
				<Dropdown
					v-if="LOCALES.length > 1"
					class="w-36"
					:model-value="locale"
					:options="localeOptions"
					@update:model-value="setLocale"
				/>
				<ColorSchemeSwitch />
			</div>
		</div>
		<p class="m-0 max-w-2xl text-sm text-secondary">{{ t(m.subtitle.id) }}</p>
	</header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Logo from '../../assets/logo.svg?component'
import { defineMessages } from '../../helpers/i18n'
import { LOCALES } from '../../helpers/locales'
import Dropdown from '../ui/Dropdown.vue'
import ColorSchemeSwitch from './ColorSchemeSwitch.vue'

const { t, locale } = useI18n()

const m = defineMessages({
	subtitle: {
		id: 'app.subtitle',
		defaultMessage:
			'Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.',
	},
})

const localeOptions = LOCALES.map((l) => ({ value: l.code, label: l.name }))

function setLocale(code: string) {
	locale.value = code
	localStorage.setItem('modfolio-locale', code)
}
</script>
