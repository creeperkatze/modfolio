<template>
	<div>
		<span class="label-tag mb-1.5 block">{{ t(m.platform.id) }}</span>
		<div class="grid grid-cols-2 gap-2">
			<button
				v-for="platform in platforms"
				:key="platform.id"
				type="button"
				class="platform-btn"
				:class="selected === platform.id ? 'platform-btn-selected' : 'platform-btn-idle'"
				:style="selected === platform.id ? { backgroundColor: '#' + platform.defaultColor } : {}"
				@click="$emit('select', platform.id)"
			>
				<span>{{ platform.name }}</span>
				<component :is="icons[platform.id]" class="size-4" />
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'

import CurseforgeIcon from '../../assets/icons/platforms/curseforge.svg?component'
import HangarIcon from '../../assets/icons/platforms/hangar.svg?component'
import ModrinthIcon from '../../assets/icons/platforms/modrinth.svg?component'
import SpigotIcon from '../../assets/icons/platforms/spigot.svg?component'
import { defineMessages } from '../../helpers/i18n'
import type { PlatformId } from '../../platforms'
import { PLATFORM_ORDER, PLATFORMS } from '../../platforms'

defineProps<{ selected: PlatformId }>()
defineEmits<{ select: [platform: PlatformId] }>()

const { t } = useI18n()
const m = defineMessages({
	platform: { id: 'field.platform', defaultMessage: 'Platform' },
})

const platforms = PLATFORM_ORDER.map((id) => PLATFORMS[id])
const icons: Record<PlatformId, Component> = {
	modrinth: ModrinthIcon,
	curseforge: CurseforgeIcon,
	hangar: HangarIcon,
	spigot: SpigotIcon,
}
</script>

<style scoped>
.platform-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.625rem 0.75rem;
	border-radius: 0.25rem;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	border: 1px solid transparent;
	transition: filter 0.15s ease;
}

.platform-btn:hover {
	filter: brightness(1.1);
}

.platform-btn-selected {
	color: #06060a;
}

.platform-btn-idle {
	background-color: var(--color-surface-4);
	color: var(--color-text-bright);
	border-color: var(--color-border);
}
</style>
