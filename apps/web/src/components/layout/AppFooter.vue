<template>
	<footer class="flex flex-col gap-3">
		<div class="grid gap-2 sm:grid-cols-3">
			<Card
				href="https://ko-fi.com/creeperkatze"
				color="#FF5E5B"
				:title="t(m.kofiTitle.id)"
				:description="t(m.kofiDescription.id)"
			>
				<template #icon>
					<KofiIcon class="size-5 shrink-0 text-[#FF5E5B] opacity-75 group-hover:opacity-100" />
				</template>
			</Card>
			<Card
				href="https://crowdin.com/project/modfolio"
				:title="t(m.crowdinTitle.id)"
				:description="t(m.crowdinDescription.id)"
			>
				<template #icon>
					<CrowdinIcon class="size-5 shrink-0 text-secondary opacity-75 group-hover:opacity-100" />
				</template>
			</Card>
			<Card
				href="https://github.com/creeperkatze/modfolio"
				:title="t(m.githubTitle.id)"
				:description="t(m.githubDescription.id)"
			>
				<template #icon>
					<GitHubIcon class="size-5 shrink-0 text-secondary opacity-75 group-hover:opacity-100" />
				</template>
			</Card>
		</div>
		<p class="m-0 text-center text-xs text-secondary">
			{{ t(m.credits.id) }}
			<a
				href="https://github.com/creeperkatze"
				target="_blank"
				rel="noopener"
				class="text-primary no-underline transition-colors hover:text-accent"
				>Creeperkatze</a
			>
		</p>
	</footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import CrowdinIcon from '../../assets/icons/crowdin.svg?component'
import GitHubIcon from '../../assets/icons/github.svg?component'
import KofiIcon from '../../assets/icons/kofi.svg?component'
import { defineMessages } from '../../helpers/i18n'
import Card from '../ui/Card.vue'

const { t } = useI18n()

const m = defineMessages({
	kofiTitle: { id: 'footer.kofi.title', defaultMessage: 'Support me' },
	kofiDescription: { id: 'footer.kofi.description', defaultMessage: 'Buy me a coffee on Ko-fi' },
	crowdinTitle: { id: 'footer.crowdin.title', defaultMessage: 'Help translate' },
	crowdinDescription: {
		id: 'footer.crowdin.description',
		defaultMessage: 'Translate Modfolio on Crowdin',
	},
	githubTitle: { id: 'footer.github.title', defaultMessage: 'Star on GitHub' },
	githubDescription: { id: 'footer.github.description', defaultMessage: 'Browse the source code' },
	credits: { id: 'footer.credits', defaultMessage: 'Made with ♥ by' },
})
</script>
