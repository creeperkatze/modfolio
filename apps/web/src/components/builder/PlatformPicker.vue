<template>
	<div class="grid grid-cols-2 gap-1.5" role="radiogroup" :aria-label="label">
		<Button
			v-for="platform in platforms"
			:key="platform.id"
			role="radio"
			:active="selected === platform.id"
			:aria-checked="selected === platform.id"
			@click="$emit('select', platform.id)"
		>
			<component
				:is="icons[platform.id]"
				class="size-4 shrink-0"
				:style="{ color: '#' + platform.defaultColor }"
				aria-hidden="true"
			/>
			{{ platform.name }}
		</Button>
	</div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

import CurseforgeIcon from '../../assets/icons/platforms/curseforge.svg?component'
import HangarIcon from '../../assets/icons/platforms/hangar.svg?component'
import ModrinthIcon from '../../assets/icons/platforms/modrinth.svg?component'
import SpigotIcon from '../../assets/icons/platforms/spigot.svg?component'
import type { PlatformId } from '../../platforms'
import { PLATFORM_ORDER, PLATFORMS } from '../../platforms'
import Button from '../ui/Button.vue'

defineProps<{ selected: PlatformId; label: string }>()
defineEmits<{ select: [platform: PlatformId] }>()

const platforms = PLATFORM_ORDER.map((id) => PLATFORMS[id])
const icons: Record<PlatformId, Component> = {
	modrinth: ModrinthIcon,
	curseforge: CurseforgeIcon,
	hangar: HangarIcon,
	spigot: SpigotIcon,
}
</script>
