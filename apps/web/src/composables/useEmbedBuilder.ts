import { computed, type InjectionKey, type Ref, ref } from 'vue'

import { lookupCurseForgeProjectId, lookupCurseForgeUserId } from '../lib/curseforgeLookup'
import type { BadgeMetric, ColorValue, EmbedType, PlatformId, TargetType } from '../platforms'
import {
	CARD_LIMITS,
	getAccentColors,
	isPlatformId,
	isProjectLikeTarget,
	isUserLikeTarget,
	parseUrl,
	PLATFORMS,
} from '../platforms'

type OptionValue = boolean | number | string | null

/** An embed query param. Only written when it applies to the current embed and differs from its default. */
interface EmbedOption {
	key: string
	value: Ref<OptionValue>
	fallback: () => OptionValue
	applies: () => boolean
}

const HEX_COLOR = /^[0-9a-f]{6}$/i

/**
 * Owns every piece of embed configuration state, the embed-URL/target-URL builders,
 * URL-paste auto-detection, and the shareable browser-URL query-param sync.
 * Does not touch the DOM or fetch the preview image — see useEmbedPreview.
 *
 * The browser URL mirrors the embed: `platform`, `type`, `target`, `metric` and `id`
 * describe what to embed, everything else uses the same params as the embed URL.
 */
export function useEmbedBuilder() {
	const selectedPlatform = ref<PlatformId>('modrinth')
	const embedType = ref<EmbedType>('card')
	const targetType = ref<TargetType>('user')
	const badgeMetric = ref<BadgeMetric>('downloads')
	const identifier = ref('')
	const urlInput = ref('')
	const curseforgeSlug = ref<string | null>(null)
	const projectTypeFilter = ref('')

	const showProjects = ref(true)
	const maxProjects = ref<number>(CARD_LIMITS.DEFAULT_COUNT)
	const showVersions = ref(true)
	const maxVersions = ref<number>(CARD_LIMITS.DEFAULT_COUNT)
	const relativeTime = ref(true)
	const showSummary = ref(false)
	const showSparklines = ref(true)
	const showDownloadBars = ref(true)
	const showIcon = ref(true)
	const showBorder = ref(true)
	const animations = ref(true)
	const selectedColor = ref(PLATFORMS.modrinth.defaultColor)
	const selectedBgColor = ref<ColorValue>(null)

	const platformConfig = computed(() => PLATFORMS[selectedPlatform.value])

	const availableMetrics = computed<BadgeMetric[]>(() => metricsFor(targetType.value))

	const accentPresets = computed(() =>
		getAccentColors(selectedPlatform.value).map((c) => ({ name: c, value: c })),
	)

	const isCard = computed(() => embedType.value === 'card')
	const isProject = computed(() => isProjectLikeTarget(targetType.value))
	const isUserLike = computed(() => isUserLikeTarget(selectedPlatform.value, targetType.value))

	const showProjectsVisible = computed(() => isCard.value && isUserLike.value)
	const showVersionsVisible = computed(() => isCard.value && isProject.value)
	const relativeTimeVisible = computed(() => showVersionsVisible.value && showVersions.value)
	const sparklinesVisible = computed(() => isCard.value && isUserLike.value)

	const options: EmbedOption[] = [
		{
			key: 'showProjects',
			value: showProjects,
			fallback: () => true,
			applies: () => showProjectsVisible.value,
		},
		{
			key: 'maxProjects',
			value: maxProjects,
			fallback: () => CARD_LIMITS.DEFAULT_COUNT,
			applies: () => showProjectsVisible.value && showProjects.value,
		},
		{
			key: 'showVersions',
			value: showVersions,
			fallback: () => true,
			applies: () => showVersionsVisible.value,
		},
		{
			key: 'maxVersions',
			value: maxVersions,
			fallback: () => CARD_LIMITS.DEFAULT_COUNT,
			applies: () => showVersionsVisible.value && showVersions.value,
		},
		{
			key: 'relativeTime',
			value: relativeTime,
			fallback: () => true,
			applies: () => relativeTimeVisible.value,
		},
		{
			key: 'showSparklines',
			value: showSparklines,
			fallback: () => true,
			applies: () => sparklinesVisible.value,
		},
		{
			key: 'showDownloadBars',
			value: showDownloadBars,
			fallback: () => true,
			applies: () => sparklinesVisible.value,
		},
		{
			key: 'projectType',
			value: projectTypeFilter,
			fallback: () => '',
			applies: () => showProjectsVisible.value,
		},
		{ key: 'showSummary', value: showSummary, fallback: () => false, applies: () => isCard.value },
		{ key: 'showIcon', value: showIcon, fallback: () => true, applies: () => !isCard.value },
		{ key: 'showBorder', value: showBorder, fallback: () => true, applies: () => true },
		{ key: 'animations', value: animations, fallback: () => true, applies: () => isCard.value },
		{
			key: 'color',
			value: selectedColor,
			fallback: () => platformConfig.value.defaultColor,
			applies: () => true,
		},
		{ key: 'backgroundColor', value: selectedBgColor, fallback: () => null, applies: () => true },
	]

	function metricsFor(target: TargetType): BadgeMetric[] {
		const config = platformConfig.value
		return config.badgeMetrics[target] || config.badgeMetrics[config.targets[0]] || ['downloads']
	}

	function embedParams() {
		const params = new URLSearchParams()
		for (const option of options) {
			if (option.applies() && option.value.value !== option.fallback()) {
				params.set(option.key, String(option.value.value))
			}
		}
		return params
	}

	function parseOption(option: EmbedOption, raw: string): OptionValue {
		const fallback = option.fallback()
		if (typeof fallback === 'boolean')
			return raw === 'true' ? true : raw === 'false' ? false : fallback
		if (typeof fallback === 'number') {
			const n = parseInt(raw)
			return Number.isNaN(n) ? fallback : Math.min(Math.max(n, 1), CARD_LIMITS.MAX_COUNT)
		}
		if (option.key === 'color' || option.key === 'backgroundColor') {
			return HEX_COLOR.test(raw) ? raw : fallback
		}
		return raw
	}

	const embedUrl = computed(() => {
		const id = identifier.value.trim()
		if (!id) return null

		const path = [selectedPlatform.value, targetType.value, encodeURIComponent(id)]
		if (!isCard.value) path.push(badgeMetric.value)

		const query = embedParams().toString()
		return `${window.location.origin}/${path.join('/')}${query ? '?' + query : ''}`
	})

	/**
	 * Touches every ref that affects the embed/browser URL, independent of whether an
	 * identifier is set yet — used to trigger sync even while embedUrl itself is still null
	 * (e.g. the user picks colors before entering an identifier).
	 */
	const configSnapshot = computed(() =>
		JSON.stringify([
			selectedPlatform.value,
			embedType.value,
			targetType.value,
			badgeMetric.value,
			identifier.value,
			...options.map((option) => option.value.value),
		]),
	)

	/** Best-effort target-site link, used until the meta fetch resolves the real one. */
	const targetUrlFallback = computed(() => {
		const config = platformConfig.value
		const id = identifier.value.trim()
		const type = targetType.value
		if (selectedPlatform.value === 'curseforge') {
			return type === 'user'
				? `https://www.${config.baseUrl}/${config.userPath}/${id}`
				: `https://www.${config.baseUrl}/${config.projectPath}/${curseforgeSlug.value || id}`
		}
		if (selectedPlatform.value === 'hangar') {
			return type === 'user'
				? `https://${config.baseUrl}/u/${id}`
				: `https://${config.baseUrl}/${config.projectPath}/${id}`
		}
		if (selectedPlatform.value === 'spigot') {
			return type === 'author'
				? `https://${config.baseUrl}/authors/${id}`
				: `https://${config.baseUrl}/${config.projectPath}/${id}/`
		}
		return `https://modrinth.com/${type}/${id}`
	})

	function setPlatform(platform: PlatformId) {
		selectedPlatform.value = platform
		resetToDefaults()
	}

	function resetToDefaults() {
		curseforgeSlug.value = null
		embedType.value = 'card'
		targetType.value = platformConfig.value.targets[0]
		badgeMetric.value = metricsFor(targetType.value)[0]
		identifier.value = ''
		urlInput.value = ''
		for (const option of options) option.value.value = option.fallback()
	}

	/** Wire this to the target-type <select>'s change event only (not programmatic sets). */
	function onTargetTypeChange() {
		projectTypeFilter.value = ''
		if (!availableMetrics.value.includes(badgeMetric.value)) {
			badgeMetric.value = availableMetrics.value[0]
		}
	}

	async function onUrlInput() {
		const val = urlInput.value.trim()
		const parsed = parseUrl(val)
		if (!parsed) return

		if (selectedPlatform.value !== parsed.platform) {
			selectedPlatform.value = parsed.platform
			selectedColor.value = PLATFORMS[parsed.platform].defaultColor
		}
		targetType.value = parsed.type

		if (parsed.isCurseForge) {
			if (parsed.type === 'project' && parsed.slug) {
				curseforgeSlug.value = parsed.slug
				const resolvedId = await lookupCurseForgeProjectId(parsed.slug)
				if (resolvedId) {
					identifier.value = resolvedId
					return
				}
				curseforgeSlug.value = null
			} else if (parsed.type === 'user') {
				projectTypeFilter.value = parsed.projectType || ''
				curseforgeSlug.value = parsed.id
				const resolvedId = await lookupCurseForgeUserId(parsed.id)
				if (resolvedId) {
					identifier.value = resolvedId
					return
				}
				curseforgeSlug.value = null
			} else {
				curseforgeSlug.value = null
				identifier.value = parsed.id
			}
		} else {
			curseforgeSlug.value = null
			identifier.value = parsed.id
			projectTypeFilter.value = parsed.projectType || ''
		}
	}

	/** Writes the current configuration to the address bar, omitting every default. */
	function updateBrowserUrl() {
		const params = new URLSearchParams()
		const id = identifier.value.trim()

		if (selectedPlatform.value !== 'modrinth') params.set('platform', selectedPlatform.value)
		if (!isCard.value) params.set('type', embedType.value)
		if (targetType.value !== platformConfig.value.targets[0]) params.set('target', targetType.value)
		if (!isCard.value && badgeMetric.value !== availableMetrics.value[0]) {
			params.set('metric', badgeMetric.value)
		}
		if (id) params.set('id', id)
		for (const [key, value] of embedParams()) params.set(key, value)

		const query = params.toString()
		window.history.replaceState(
			null,
			'',
			query ? `${window.location.pathname}?${query}` : window.location.pathname,
		)
	}

	/** Restores state from the address bar. `?url=` pre-fills from a platform link instead. */
	function loadFromUrl() {
		const params = new URLSearchParams(window.location.search)

		const url = params.get('url')
		if (url) {
			urlInput.value = url
			void onUrlInput()
			return
		}

		const platform = params.get('platform') ?? ''
		selectedPlatform.value = isPlatformId(platform) ? platform : 'modrinth'
		resetToDefaults()

		if (params.get('type') === 'badge') embedType.value = 'badge'

		const target = params.get('target') as TargetType | null
		if (target && platformConfig.value.targets.includes(target)) targetType.value = target

		const metrics = metricsFor(targetType.value)
		const metric = params.get('metric') as BadgeMetric | null
		badgeMetric.value = metric && metrics.includes(metric) ? metric : metrics[0]

		identifier.value = params.get('id') ?? ''

		for (const option of options) {
			const raw = params.get(option.key)
			if (raw !== null) option.value.value = parseOption(option, raw)
		}
	}

	return {
		selectedPlatform,
		embedType,
		targetType,
		badgeMetric,
		identifier,
		urlInput,
		projectTypeFilter,

		showProjects,
		maxProjects,
		showVersions,
		maxVersions,
		relativeTime,
		showSummary,
		showSparklines,
		showDownloadBars,
		showIcon,
		showBorder,
		animations,
		selectedColor,
		selectedBgColor,

		platformConfig,
		availableMetrics,
		accentPresets,
		isUserLike,
		showProjectsVisible,
		showVersionsVisible,
		relativeTimeVisible,
		sparklinesVisible,
		embedUrl,
		configSnapshot,
		targetUrlFallback,

		setPlatform,
		resetToDefaults,
		onTargetTypeChange,
		onUrlInput,
		updateBrowserUrl,
		loadFromUrl,
	}
}

export type EmbedBuilder = ReturnType<typeof useEmbedBuilder>

/** Shares the single builder instance across the EmbedSettings/CustomizationSettings subtree. */
export const EmbedBuilderKey: InjectionKey<EmbedBuilder> = Symbol('embedBuilder')
