<template>
	<div class="flex flex-col gap-2">
		<OptionRow :icon="Link" :label="t(m.url.id)" :description="t(m.urlHint.id)" label-for="url">
			<template #below>
				<Input
					id="url"
					type="url"
					autocomplete="off"
					spellcheck="false"
					class="w-full"
					:model-value="builder.urlInput.value"
					:placeholder="urlPlaceholder"
					@update:model-value="onUrlInput"
				/>
			</template>
		</OptionRow>

		<OptionRow :icon="Blocks" :label="t(m.platform.id)">
			<template #below>
				<PlatformPicker
					:label="t(m.platform.id)"
					:selected="builder.selectedPlatform.value"
					@select="builder.setPlatform"
				/>
			</template>
		</OptionRow>

		<OptionSelect
			v-model="builder.embedType.value"
			:icon="LayoutTemplate"
			:label="t(m.type.id)"
			:description="t(m.typeHint.id)"
			:options="typeOptions"
		/>

		<OptionSelect
			v-model="builder.targetType.value"
			:icon="Crosshair"
			:label="t(m.target.id)"
			:description="t(m.targetHint.id)"
			:options="targetOptions"
			@change="builder.onTargetTypeChange"
		/>

		<OptionSelect
			v-if="builder.embedType.value === 'badge'"
			v-model="builder.badgeMetric.value"
			:icon="Hash"
			:label="t(m.badgeMetric.id)"
			:description="t(m.badgeMetricHint.id)"
			:options="metricOptions"
		/>

		<IdentifierField
			v-model="builder.identifier.value"
			:platform="builder.selectedPlatform.value"
			:target="builder.targetType.value"
		/>

		<OptionSelect
			v-if="
				builder.embedType.value === 'card' &&
				builder.isUserLike.value &&
				projectTypeOptions.length > 0
			"
			v-model="builder.projectTypeFilter.value"
			:icon="Funnel"
			:label="t(m.projectType.id)"
			:description="t(m.projectTypeHint.id)"
			:options="projectTypeOptions"
		/>
	</div>
</template>

<script setup lang="ts">
import { Blocks, Crosshair, Funnel, Hash, LayoutTemplate, Link } from '@lucide/vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { EmbedBuilderKey } from '../../composables/useEmbedBuilder'
import { defineMessages } from '../../helpers/i18n'
import OptionRow from '../options/OptionRow.vue'
import OptionSelect from '../options/OptionSelect.vue'
import Input from '../ui/Input.vue'
import IdentifierField from './IdentifierField.vue'
import PlatformPicker from './PlatformPicker.vue'

const builder = inject(EmbedBuilderKey)!

const { t } = useI18n()

const m = defineMessages({
	url: { id: 'field.url', defaultMessage: 'URL' },
	urlHint: { id: 'hint.url', defaultMessage: 'Paste a link to fill in everything below' },
	platform: { id: 'field.platform', defaultMessage: 'Platform' },
	type: { id: 'field.type', defaultMessage: 'Type' },
	typeHint: { id: 'hint.type', defaultMessage: 'A detailed card or a compact badge' },
	target: { id: 'field.target', defaultMessage: 'Target' },
	targetHint: { id: 'hint.target', defaultMessage: 'What the embed is about' },
	badgeMetric: { id: 'field.badgeMetric', defaultMessage: 'Badge Metric' },
	badgeMetricHint: { id: 'hint.badgeMetric', defaultMessage: 'The stat shown on the badge' },
	projectType: { id: 'field.projectType', defaultMessage: 'Project Type' },
	projectTypeHint: {
		id: 'hint.projectType',
		defaultMessage: 'Only include projects of this type',
	},

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

function onUrlInput(value: string) {
	builder.urlInput.value = value
	void builder.onUrlInput()
}

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
