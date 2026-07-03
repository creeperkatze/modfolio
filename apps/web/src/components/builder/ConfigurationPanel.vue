<template>
	<CollapsiblePanel v-model:expanded="expanded" :title="t(m.title.id)">
		<TextField
			v-model="builder.urlInput.value"
			:label="t(m.url.id)"
			:placeholder="urlPlaceholder"
			@input="builder.onUrlInput"
			@paste="builder.onUrlPaste"
		/>

		<hr class="border-border border-t" />

		<PlatformPicker :selected="builder.selectedPlatform.value" @select="builder.setPlatform" />

		<hr class="border-border border-t" />

		<SelectField v-model="builder.embedType.value" :label="t(m.type.id)" :options="typeOptions" />

		<SelectField
			v-model="builder.targetType.value"
			:label="t(m.target.id)"
			:options="targetOptions"
			@change="builder.onTargetTypeChange"
		/>

		<SelectField
			v-if="builder.embedType.value === 'badge'"
			v-model="builder.badgeMetric.value"
			:label="t(m.badgeMetric.id)"
			:options="metricOptions"
		/>

		<IdentifierField
			v-model="builder.identifier.value"
			:platform="builder.selectedPlatform.value"
			:target="builder.targetType.value"
		/>

		<SelectField
			v-if="
				builder.embedType.value === 'card' &&
				builder.isUserLike.value &&
				projectTypeOptions.length > 0
			"
			v-model="builder.projectTypeFilter.value"
			:label="t(m.projectType.id)"
			:options="projectTypeOptions"
		/>
	</CollapsiblePanel>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { EmbedBuilderKey } from '../../composables/useEmbedBuilder'
import { defineMessages } from '../../helpers/i18n'
import CollapsiblePanel from '../ui/CollapsiblePanel.vue'
import SelectField from '../ui/SelectField.vue'
import TextField from '../ui/TextField.vue'
import IdentifierField from './IdentifierField.vue'
import PlatformPicker from './PlatformPicker.vue'

const builder = inject(EmbedBuilderKey)!

const { t } = useI18n()
const expanded = ref(true)

const m = defineMessages({
	title: { id: 'section.configuration', defaultMessage: 'Configuration' },
	url: { id: 'field.url', defaultMessage: 'URL' },
	type: { id: 'field.type', defaultMessage: 'Type' },
	target: { id: 'field.target', defaultMessage: 'Target' },
	badgeMetric: { id: 'field.badgeMetric', defaultMessage: 'Badge Metric' },
	projectType: { id: 'field.projectType', defaultMessage: 'Project Type' },

	typeCard: { id: 'type.card', defaultMessage: 'Card' },
	typeBadge: { id: 'type.badge', defaultMessage: 'Badge' },

	targetUser: { id: 'target.user', defaultMessage: 'User' },
	targetProject: { id: 'target.project', defaultMessage: 'Project' },
	targetOrganization: { id: 'target.organization', defaultMessage: 'Organization' },
	targetCollection: { id: 'target.collection', defaultMessage: 'Collection' },
	targetAuthor: { id: 'target.author', defaultMessage: 'Author' },
	targetResource: { id: 'target.resource', defaultMessage: 'Resource' },

	metricDownloads: { id: 'metric.downloads', defaultMessage: 'Downloads' },
	metricFollowers: { id: 'metric.followers', defaultMessage: 'Followers' },
	metricProjects: { id: 'metric.projects', defaultMessage: 'Projects' },
	metricRank: { id: 'metric.rank', defaultMessage: 'Rank' },
	metricStars: { id: 'metric.stars', defaultMessage: 'Stars' },
	metricVersions: { id: 'metric.versions', defaultMessage: 'Versions' },
	metricViews: { id: 'metric.views', defaultMessage: 'Views' },
	metricLikes: { id: 'metric.likes', defaultMessage: 'Likes' },
	metricResources: { id: 'metric.resources', defaultMessage: 'Resources' },
	metricRating: { id: 'metric.rating', defaultMessage: 'Rating' },
	metricPlayers: { id: 'metric.players', defaultMessage: 'Players Online' },

	projectTypeAll: { id: 'projectType.all', defaultMessage: 'All Types' },
	projectTypeMod: { id: 'projectType.mod', defaultMessage: 'Mods' },
	projectTypeModpack: { id: 'projectType.modpack', defaultMessage: 'Modpacks' },
	projectTypeResourcepack: { id: 'projectType.resourcepack', defaultMessage: 'Resource Packs' },
	projectTypeShader: { id: 'projectType.shader', defaultMessage: 'Shaders' },
	projectTypeDatapack: { id: 'projectType.datapack', defaultMessage: 'Data Packs' },
	projectTypePlugin: { id: 'projectType.plugin', defaultMessage: 'Plugins' },
	projectTypeTexturePack: { id: 'projectType.texturePack', defaultMessage: 'Texture Packs' },
	projectTypeBukkitPlugin: { id: 'projectType.bukkitPlugin', defaultMessage: 'Bukkit Plugins' },
})

const urlPlaceholder = computed(
	() =>
		`https://www.${builder.platformConfig.value.baseUrl}/${builder.platformConfig.value.projectPath}/example`,
)

const typeOptions = computed(() => [
	{ value: 'card', label: t(m.typeCard.id) },
	{ value: 'badge', label: t(m.typeBadge.id) },
])

const TARGET_LABEL_IDS: Record<string, string> = {
	user: m.targetUser.id,
	project: m.targetProject.id,
	organization: m.targetOrganization.id,
	collection: m.targetCollection.id,
	author: m.targetAuthor.id,
	resource: m.targetResource.id,
}

const targetOptions = computed(() =>
	builder.platformConfig.value.targets.map((tgt) => ({
		value: tgt,
		label: t(TARGET_LABEL_IDS[tgt]),
	})),
)

const METRIC_LABEL_IDS: Record<string, string> = {
	downloads: m.metricDownloads.id,
	followers: m.metricFollowers.id,
	projects: m.metricProjects.id,
	rank: m.metricRank.id,
	stars: m.metricStars.id,
	versions: m.metricVersions.id,
	views: m.metricViews.id,
	likes: m.metricLikes.id,
	resources: m.metricResources.id,
	rating: m.metricRating.id,
	players: m.metricPlayers.id,
}

const metricOptions = computed(() =>
	builder.availableMetrics.value.map((metric) => ({
		value: metric,
		label: t(METRIC_LABEL_IDS[metric]),
	})),
)

const PROJECT_TYPE_LABEL_IDS: Record<string, string> = {
	'All Types': m.projectTypeAll.id,
	Mods: m.projectTypeMod.id,
	Modpacks: m.projectTypeModpack.id,
	'Resource Packs': m.projectTypeResourcepack.id,
	Shaders: m.projectTypeShader.id,
	'Data Packs': m.projectTypeDatapack.id,
	Plugins: m.projectTypePlugin.id,
	'Texture Packs': m.projectTypeTexturePack.id,
	'Bukkit Plugins': m.projectTypeBukkitPlugin.id,
}

const projectTypeOptions = computed(
	() =>
		builder.platformConfig.value.projectTypeOptions?.map((opt) => ({
			value: opt.value,
			label: PROJECT_TYPE_LABEL_IDS[opt.label] ? t(PROJECT_TYPE_LABEL_IDS[opt.label]) : opt.label,
		})) ?? [],
)
</script>
