<template>
	<footer
		class="text-text-muted mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-6 text-center text-base font-medium"
	>
		<span>{{ t(m.credits.id) }}</span>
		<a
			href="https://github.com/creeperkatze"
			target="_blank"
			class="dynamic-link no-underline transition-opacity hover:opacity-70"
			>Creeperkatze</a
		>
		·
		<a
			href="https://github.com/creeperkatze/modfolio"
			target="_blank"
			class="dynamic-link no-underline transition-opacity hover:opacity-70"
			>{{ t(m.source.id) }}</a
		>
		·
		<a
			href="https://github.com/creeperkatze/modfolio"
			target="_blank"
			class="text-yellow inline-flex shrink-0 items-center gap-1 no-underline transition-opacity hover:opacity-70"
		>
			<Star class="size-4 shrink-0" aria-hidden="true" />
			<span>{{ t(m.github.id) }}</span>
		</a>
		·
		<a
			href="https://ko-fi.com/creeperkatze"
			target="_blank"
			class="inline-flex shrink-0 items-center gap-1 text-[#FF5E5B] no-underline transition-opacity hover:opacity-70"
		>
			<KofiIcon class="size-4 shrink-0 fill-current" aria-hidden="true" />
			<span>{{ t(m.donate.id) }}</span>
		</a>
		· {{ t(m.notAffiliated.id) }}
	</footer>
</template>

<script setup lang="ts">
import { Star } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

import KofiIcon from '../../assets/icons/kofi.svg?component'
import { defineMessages } from '../../helpers/i18n'

const { t } = useI18n()

const m = defineMessages({
	credits: { id: 'footer.credits', defaultMessage: 'Made with ♥ by' },
	source: { id: 'footer.source', defaultMessage: 'Source' },
	github: { id: 'footer.github', defaultMessage: 'On GitHub' },
	donate: { id: 'footer.donate', defaultMessage: 'Donate' },
	notAffiliated: {
		id: 'footer.notAffiliated',
		defaultMessage: 'Not affiliated with Modrinth, CurseForge, Hangar or Spigot',
	},
})
</script>
