<template>
	<TextField
		v-model="model"
		:label="valueLabel"
		:placeholder="valuePlaceholder"
		@input="$emit('input')"
		@paste="$emit('paste')"
	/>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { defineMessages } from '../../helpers/i18n'
import type { PlatformId, TargetType } from '../../platforms'
import TextField from '../ui/TextField.vue'

const props = defineProps<{
	platform: PlatformId
	target: TargetType
}>()

const model = defineModel<string>({ default: '' })

defineEmits<{
	input: []
	paste: []
}>()

const { t } = useI18n()

const m = defineMessages({
	labelUserCurseforge: { id: 'value.label.user.curseforge', defaultMessage: 'User ID' },
	labelUserDefault: { id: 'value.label.user.default', defaultMessage: 'Username' },
	labelProjectNumeric: { id: 'value.label.project.numeric', defaultMessage: 'Project ID' },
	labelProjectDefault: { id: 'value.label.project.default', defaultMessage: 'Project Slug' },
	labelOrganization: { id: 'value.label.organization', defaultMessage: 'Organization Slug' },
	labelCollection: { id: 'value.label.collection', defaultMessage: 'Collection ID' },
	labelAuthor: { id: 'value.label.author', defaultMessage: 'Author ID' },
	labelResource: { id: 'value.label.resource', defaultMessage: 'Resource ID' },
	labelDefault: { id: 'value.label.default', defaultMessage: 'Value' },

	placeholderUserCurseforge: {
		id: 'value.placeholder.user.curseforge',
		defaultMessage: 'Enter user ID',
	},
	placeholderUserDefault: {
		id: 'value.placeholder.user.default',
		defaultMessage: 'Enter username or ID',
	},
	placeholderProjectNumeric: {
		id: 'value.placeholder.project.numeric',
		defaultMessage: 'Enter project ID',
	},
	placeholderProjectDefault: {
		id: 'value.placeholder.project.default',
		defaultMessage: 'Enter project ID or slug',
	},
	placeholderOrganization: {
		id: 'value.placeholder.organization',
		defaultMessage: 'Enter organization slug or ID',
	},
	placeholderCollection: {
		id: 'value.placeholder.collection',
		defaultMessage: 'Enter collection ID',
	},
	placeholderAuthor: { id: 'value.placeholder.author', defaultMessage: 'Enter author ID' },
	placeholderResource: { id: 'value.placeholder.resource', defaultMessage: 'Enter resource ID' },
})

/** Platform x target matrix — CurseForge/Spigot IDs are numeric, Modrinth/Hangar use slugs. */
const valueLabel = computed(() => {
	switch (props.target) {
		case 'user':
			return props.platform === 'curseforge'
				? t(m.labelUserCurseforge.id)
				: t(m.labelUserDefault.id)
		case 'project':
			return props.platform === 'curseforge' || props.platform === 'spigot'
				? t(m.labelProjectNumeric.id)
				: t(m.labelProjectDefault.id)
		case 'organization':
			return t(m.labelOrganization.id)
		case 'collection':
			return t(m.labelCollection.id)
		case 'author':
			return t(m.labelAuthor.id)
		case 'resource':
			return t(m.labelResource.id)
		default:
			return t(m.labelDefault.id)
	}
})

const valuePlaceholder = computed(() => {
	switch (props.target) {
		case 'user':
			return props.platform === 'curseforge'
				? t(m.placeholderUserCurseforge.id)
				: t(m.placeholderUserDefault.id)
		case 'project':
			return props.platform === 'curseforge'
				? t(m.placeholderProjectNumeric.id)
				: t(m.placeholderProjectDefault.id)
		case 'organization':
			return t(m.placeholderOrganization.id)
		case 'collection':
			return t(m.placeholderCollection.id)
		case 'author':
			return t(m.placeholderAuthor.id)
		case 'resource':
			return t(m.placeholderResource.id)
		default:
			return ''
	}
})
</script>
