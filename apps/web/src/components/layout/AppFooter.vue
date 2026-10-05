<template>
	<footer
		class="flex shrink-0 items-center gap-1 border-t border-border-subtle px-3 py-2 text-xs text-secondary lg:py-1.5"
	>
		{{ t(m.credits.id) }}
		<a
			href="https://github.com/creeperkatze"
			target="_blank"
			rel="noopener"
			class="text-primary no-underline transition-colors hover:text-accent"
			>Creeperkatze</a
		>
	</footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'

const { t } = useI18n()

const m = defineMessages({
	credits: { id: 'footer.credits', defaultMessage: 'Made with ♥ by' },
})
</script>
