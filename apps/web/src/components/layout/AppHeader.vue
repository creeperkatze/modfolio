<template>
	<div>
		<div class="mb-5 flex items-start justify-between gap-4">
			<a href="/" class="inline-flex items-center no-underline">
				<h1 class="sr-only">Modfolio</h1>
				<Logo class="h-9 w-auto" role="img" aria-label="Modfolio" />
			</a>
			<select v-if="LOCALES.length > 1" v-model="locale" class="field-input w-auto py-2 text-sm">
				<option v-for="loc in LOCALES" :key="loc.code" :value="loc.code">{{ loc.name }}</option>
			</select>
		</div>
		<p class="text-text-primary mb-6 max-w-2xl text-base leading-relaxed">
			{{ t(m.subtitle.id) }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Logo from '../../assets/logo.svg?component'
import { defineMessages } from '../../helpers/i18n'
import { LOCALES } from '../../helpers/locales'

const { t, locale } = useI18n()

const m = defineMessages({
	subtitle: {
		id: 'app.subtitle',
		defaultMessage:
			'Generate fast, beautiful and consistent embeddable cards and badges for Modrinth, CurseForge, Hangar and Spigot content.',
	},
})
</script>
