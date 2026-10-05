<template>
	<div
		class="flex items-center justify-between border-b border-border-subtle bg-surface-2 p-4 lg:hidden"
	>
		<Logo class="h-7 w-auto text-primary" role="img" aria-label="Modfolio" />
		<button
			type="button"
			class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-control text-secondary transition-colors hover:bg-surface-3 hover:text-primary"
			:aria-expanded="open"
			:aria-label="t(m.open.id)"
			@click="open = true"
		>
			<Menu class="size-4" />
		</button>
	</div>

	<div v-if="open" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="open = false" />

	<aside
		class="fixed inset-y-0 inset-s-0 z-40 flex w-56 max-w-[85vw] flex-col border-e border-border-subtle bg-surface-2 transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-screen lg:max-w-none lg:shrink-0"
		:class="{ 'max-lg:-translate-x-full max-lg:rtl:translate-x-full': !open }"
	>
		<div class="flex items-center justify-between gap-2 border-b border-border-subtle p-4">
			<a href="/" class="min-w-0 text-primary no-underline">
				<h1 class="sr-only">Modfolio</h1>
				<Logo class="h-auto w-full max-w-40" role="img" aria-label="Modfolio" />
			</a>
			<button
				type="button"
				class="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface-control text-secondary transition-colors hover:bg-surface-3 hover:text-primary lg:hidden"
				:aria-label="t(m.close.id)"
				@click="open = false"
			>
				<ChevronLeft class="size-4 rtl:-scale-x-100" />
			</button>
		</div>

		<nav class="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
			<SidebarTab
				v-for="item in tabs"
				:key="item.id"
				:icon="item.icon"
				:label="item.label"
				:active="tab === item.id"
				@click="select(item.id)"
			/>
		</nav>

		<div class="flex flex-col gap-1.5 border-t border-border-subtle p-2">
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

		<div class="flex items-center gap-2 border-t border-border-subtle p-2">
			<Dropdown
				v-if="LOCALES.length > 1"
				class="min-w-0 flex-1"
				:model-value="locale"
				:options="localeOptions"
				@update:model-value="setLocale"
			/>
			<ColorSchemeSwitch />
		</div>

		<AppFooter />
	</aside>
</template>

<script setup lang="ts" generic="T extends string">
import { ChevronLeft, Menu } from '@lucide/vue'
import { type Component, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import CrowdinIcon from '../../assets/icons/crowdin.svg?component'
import GitHubIcon from '../../assets/icons/github.svg?component'
import KofiIcon from '../../assets/icons/kofi.svg?component'
import Logo from '../../assets/logo.svg?component'
import { defineMessages } from '../../helpers/i18n'
import { LOCALES } from '../../helpers/locales'
import Card from '../ui/Card.vue'
import Dropdown from '../ui/Dropdown.vue'
import AppFooter from './AppFooter.vue'
import ColorSchemeSwitch from './ColorSchemeSwitch.vue'
import SidebarTab from './SidebarTab.vue'

defineProps<{
	tabs: { id: T; label: string; icon: Component }[]
}>()

const tab = defineModel<T>('tab', { required: true })

const { t, locale } = useI18n()

const m = defineMessages({
	open: { id: 'sidebar.open', defaultMessage: 'Open menu' },
	close: { id: 'sidebar.close', defaultMessage: 'Close menu' },
	kofiTitle: { id: 'footer.kofi.title', defaultMessage: 'Support me' },
	kofiDescription: { id: 'footer.kofi.description', defaultMessage: 'Buy me a coffee on Ko-fi' },
	crowdinTitle: { id: 'footer.crowdin.title', defaultMessage: 'Help translate' },
	crowdinDescription: {
		id: 'footer.crowdin.description',
		defaultMessage: 'Translate Modfolio on Crowdin',
	},
	githubTitle: { id: 'footer.github.title', defaultMessage: 'Star on GitHub' },
	githubDescription: { id: 'footer.github.description', defaultMessage: 'Browse the source code' },
})

const open = ref(false)

function select(id: T) {
	tab.value = id
	open.value = false
}

const localeOptions = LOCALES.map((l) => ({ value: l.code, label: l.name }))

function setLocale(code: string) {
	locale.value = code
	localStorage.setItem('modfolio-locale', code)
}
</script>
