import { computed, type InjectionKey, ref } from 'vue'

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

/**
 * Owns every piece of embed configuration state, the embed-URL/target-URL builders,
 * URL-paste auto-detection, and the shareable browser-URL query-param sync.
 * Does not touch the DOM or fetch the preview image — see useEmbedPreview.
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

	const availableMetrics = computed<BadgeMetric[]>(() => {
		const metrics =
			platformConfig.value.badgeMetrics[targetType.value] ||
			platformConfig.value.badgeMetrics[platformConfig.value.targets[0]]
		return metrics || ['downloads']
	})

	const accentPresets = computed(() =>
		getAccentColors(selectedPlatform.value).map((c) => ({ name: c, value: c })),
	)

	const isProject = computed(() => isProjectLikeTarget(targetType.value))
	const isUserLike = computed(() => isUserLikeTarget(selectedPlatform.value, targetType.value))

	const showProjectsVisible = computed(() => embedType.value === 'card' && isUserLike.value)
	const showVersionsVisible = computed(() => embedType.value === 'card' && isProject.value)
	const relativeTimeVisible = computed(
		() => embedType.value === 'card' && isProject.value && showVersions.value,
	)
	const sparklinesVisible = computed(() => embedType.value === 'card' && isUserLike.value)

	const embedUrl = computed(() => {
		const id = identifier.value.trim()
		if (!id) return null

		const config = platformConfig.value
		const platform = selectedPlatform.value
		const type = targetType.value

		if (embedType.value === 'badge') {
			const params = new URLSearchParams()
			if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
			if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
			if (!showIcon.value) params.set('showIcon', 'false')
			if (!showBorder.value) params.set('showBorder', 'false')
			const q = params.toString()
			return `${window.location.origin}/${platform}/${type}/${id}/${badgeMetric.value}${q ? '?' + q : ''}`
		}

		const params = new URLSearchParams()

		if (isUserLike.value) {
			if (!showProjects.value) params.set('showProjects', 'false')
			if (maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT)
				params.set('maxProjects', String(maxProjects.value))
		}
		if (isProject.value) {
			if (!showVersions.value) params.set('showVersions', 'false')
			if (maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT)
				params.set('maxVersions', String(maxVersions.value))
			if (!relativeTime.value) params.set('relativeTime', 'false')
		}
		if (isUserLike.value) {
			if (!showSparklines.value) params.set('showSparklines', 'false')
			if (!showDownloadBars.value) params.set('showDownloadBars', 'false')
			if (projectTypeFilter.value) params.set('projectType', projectTypeFilter.value)
		}
		if (showSummary.value) params.set('showSummary', 'true')
		if (!showBorder.value) params.set('showBorder', 'false')
		if (!animations.value) params.set('animations', 'false')
		if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
		if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)

		const q = params.toString()
		return `${window.location.origin}/${platform}/${type}/${id}${q ? '?' + q : ''}`
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
			projectTypeFilter.value,
			showProjects.value,
			maxProjects.value,
			showVersions.value,
			maxVersions.value,
			relativeTime.value,
			showSummary.value,
			showSparklines.value,
			showDownloadBars.value,
			showIcon.value,
			showBorder.value,
			animations.value,
			selectedColor.value,
			selectedBgColor.value,
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
		selectedColor.value = PLATFORMS[platform].defaultColor
		targetType.value = PLATFORMS[platform].targets[0]
		badgeMetric.value = (PLATFORMS[platform].badgeMetrics[PLATFORMS[platform].targets[0]] || [
			'downloads',
		])[0]
		resetToDefaults()
	}

	function resetToDefaults() {
		const config = platformConfig.value
		curseforgeSlug.value = null
		embedType.value = 'card'
		targetType.value = config.targets[0]
		badgeMetric.value = (config.badgeMetrics[config.targets[0]] || ['downloads'])[0]
		identifier.value = ''
		urlInput.value = ''
		projectTypeFilter.value = ''
		showProjects.value = true
		maxProjects.value = CARD_LIMITS.DEFAULT_COUNT
		showVersions.value = true
		maxVersions.value = CARD_LIMITS.DEFAULT_COUNT
		relativeTime.value = true
		showSummary.value = false
		showSparklines.value = true
		showDownloadBars.value = true
		showIcon.value = true
		showBorder.value = true
		animations.value = true
		selectedColor.value = config.defaultColor
		selectedBgColor.value = null
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

	function onUrlPaste() {
		setTimeout(() => onUrlInput(), 10)
	}

	function updateBrowserUrl() {
		const params = new URLSearchParams()
		const config = platformConfig.value
		const type = targetType.value
		const id = identifier.value.trim()

		if (selectedPlatform.value !== 'modrinth') params.set('platform', selectedPlatform.value)
		if (embedType.value !== 'card') params.set('type', embedType.value)
		params.set('target', type)
		if (badgeMetric.value !== 'downloads') params.set('metric', badgeMetric.value)
		if (id) params.set('value', id)

		if (embedType.value === 'card') {
			if (isUserLike.value && !showProjects.value) params.set('showProjects', 'false')
			if (isUserLike.value && maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT)
				params.set('maxProjects', String(maxProjects.value))
			if (!showVersions.value) params.set('showVersions', 'false')
			if (maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT)
				params.set('maxVersions', String(maxVersions.value))
			if (!relativeTime.value) params.set('relativeTime', 'false')
			if (!showSparklines.value) params.set('showSparklines', 'false')
			if (!showDownloadBars.value) params.set('showDownloadBars', 'false')
			if (isUserLike.value && projectTypeFilter.value)
				params.set('projectType', projectTypeFilter.value)
			if (showSummary.value) params.set('showSummary', 'true')
			if (!showBorder.value) params.set('showBorder', 'false')
			if (!animations.value) params.set('animations', 'false')
			if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
			if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
		} else {
			if (selectedColor.value !== config.defaultColor) params.set('color', selectedColor.value)
			if (selectedBgColor.value !== null) params.set('backgroundColor', selectedBgColor.value)
			if (!showIcon.value) params.set('showIcon', 'false')
			if (!showBorder.value) params.set('showBorder', 'false')
		}

		const newUrl = params.toString()
			? `${window.location.pathname}?${params.toString()}`
			: window.location.pathname
		window.history.replaceState(null, '', newUrl)
	}

	/** Restores state from the shareable browser URL. Returns true if any non-default option was set. */
	function loadFromUrl(): boolean {
		const rawParams = new URLSearchParams(window.location.search)

		const urlParam = rawParams.get('url')
		if (urlParam) {
			urlInput.value = urlParam
			void onUrlInput()
			return false
		}

		const platformParam = rawParams.get('platform') || 'modrinth'
		const platform = isPlatformId(platformParam) ? platformParam : 'modrinth'
		const config = PLATFORMS[platform]

		selectedPlatform.value = platform
		embedType.value = rawParams.get('type') === 'badge' ? 'badge' : 'card'
		const targetParam = rawParams.get('target') as TargetType | null
		targetType.value =
			targetParam && config.targets.includes(targetParam) ? targetParam : config.targets[0]
		const metricParam = rawParams.get('metric') as BadgeMetric | null
		badgeMetric.value = metricParam || 'downloads'
		identifier.value = rawParams.get('value') || ''

		projectTypeFilter.value = rawParams.get('projectType') || ''

		showProjects.value = rawParams.get('showProjects') !== 'false'
		maxProjects.value = parseInt(rawParams.get('maxProjects') || '') || CARD_LIMITS.DEFAULT_COUNT
		showVersions.value = rawParams.get('showVersions') !== 'false'
		maxVersions.value = parseInt(rawParams.get('maxVersions') || '') || CARD_LIMITS.DEFAULT_COUNT
		relativeTime.value = rawParams.get('relativeTime') !== 'false'
		showSummary.value = rawParams.get('showSummary') === 'true'
		showSparklines.value = rawParams.get('showSparklines') !== 'false'
		showDownloadBars.value = rawParams.get('showDownloadBars') !== 'false'
		showIcon.value = rawParams.get('showIcon') !== 'false'
		showBorder.value = rawParams.get('showBorder') !== 'false'
		animations.value = rawParams.get('animations') !== 'false'
		selectedColor.value = rawParams.get('color') || config.defaultColor
		selectedBgColor.value = rawParams.get('backgroundColor') || null

		return (
			selectedColor.value !== config.defaultColor ||
			selectedBgColor.value !== null ||
			!showProjects.value ||
			maxProjects.value !== CARD_LIMITS.DEFAULT_COUNT ||
			!showVersions.value ||
			maxVersions.value !== CARD_LIMITS.DEFAULT_COUNT ||
			!relativeTime.value ||
			showSummary.value ||
			!showSparklines.value ||
			!showDownloadBars.value ||
			!showIcon.value ||
			!showBorder.value ||
			!animations.value
		)
	}

	return {
		selectedPlatform,
		embedType,
		targetType,
		badgeMetric,
		identifier,
		urlInput,
		curseforgeSlug,
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
		isProject,
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
		onUrlPaste,
		updateBrowserUrl,
		loadFromUrl,
	}
}

export type EmbedBuilder = ReturnType<typeof useEmbedBuilder>

/** Shares the single builder instance across the tightly-coupled ConfigurationPanel/CustomizationPanel subtree. */
export const EmbedBuilderKey: InjectionKey<EmbedBuilder> = Symbol('embedBuilder')
