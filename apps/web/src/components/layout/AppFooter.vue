<template>
	<footer
		class="flex shrink-0 flex-col gap-1 border-t border-border-subtle px-3 py-2.5 text-xs text-secondary"
	>
		<span>
			{{ t(m.credits.id) }}
			<a
				href="https://github.com/creeperkatze"
				target="_blank"
				rel="noopener"
				class="font-medium text-primary no-underline transition-colors hover:text-accent"
				>Creeperkatze</a
			>
		</span>
		<span class="text-muted">{{ t(m.notAffiliated.id) }}</span>
	</footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'

const { t } = useI18n()

const m = defineMessages({
	credits: { id: 'footer.credits', defaultMessage: 'Made with ♥ by' },
	notAffiliated: {
		id: 'footer.notAffiliated',
		defaultMessage: 'Not affiliated with Modrinth, CurseForge, Hangar or Spigot',
	},
})
</script>
