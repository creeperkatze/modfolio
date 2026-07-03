<template>
	<div>
		<div class="mb-5 flex items-start justify-between gap-4">
			<a href="/" class="text-text-bright inline-flex items-center no-underline">
				<h1 class="sr-only">Modfolio</h1>
				<Logo class="h-9 w-auto" role="img" aria-label="Modfolio" />
			</a>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="bg-surface-4 border-border text-text-bright flex size-9 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors duration-100 hover:border-(--platform-color)"
					:aria-label="t(isLight ? m.switchToDark.id : m.switchToLight.id)"
					@click="toggle"
				>
					<Moon v-if="isLight" class="size-4" aria-hidden="true" />
					<Sun v-else class="size-4" aria-hidden="true" />
				</button>
				<select
					v-if="LOCALES.length > 1"
					v-model="locale"
					class="bg-surface-4 border-border text-text-bright w-auto rounded border px-3 py-2 text-sm font-medium outline-none transition-colors duration-100 focus:border-(--platform-color)"
				>
					<option v-for="loc in LOCALES" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
				</select>
			</div>
		</div>
		<p class="text-text-primary mb-6 max-w-2xl text-base leading-relaxed">
			{{ t(m.subtitle.id) }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import Logo from '../../assets/logo.svg?component'
import { useColorScheme } from '../../composables/useColorScheme'
import { defineMessages } from '../../helpers/i18n'
import { LOCALES } from '../../helpers/locales'

const { t, locale } = useI18n()
const { isLight, toggle } = useColorScheme()

const m = defineMessages({
	subtitle: {
		id: 'app.subtitle',
		defaultMessage:
			'Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.',
	},
	switchToLight: { id: 'action.switchToLight', defaultMessage: 'Switch to light mode' },
	switchToDark: { id: 'action.switchToDark', defaultMessage: 'Switch to dark mode' },
})
</script>
