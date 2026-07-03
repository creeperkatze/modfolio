import { CARD_LIMITS, getStatConfigs } from '../../constants/platformConfig.js'
import { formatNumber } from '../../utils/formatters.js'
import {
	calculateBottomDelay,
	generateActivitySparkline,
	generateAttribution,
	generateDivider,
	generateHeader,
	generateInfo,
	generateProfileImage,
	generateProjectList,
	generateStatsGrid,
	generateSummary,
	generateSvgWrapper,
	getThemeColors,
} from '../../utils/svgComponents.js'

export function generateOrganizationCard(data, options, platformConfig) {
	const { organization, projects, stats } = data
	const {
		showProjects = true,
		maxProjects = CARD_LIMITS.DEFAULT_COUNT,
		showSparklines = true,
		showDownloadBars = true,
		showSummary = false,
		color = null,
		backgroundColor = null,
		fromCache = false,
		showBorder = true,
		animations = true,
	} = options

	// Use platform default color if no custom color specified
	const accentColor = color || platformConfig.defaultColor
	const colors = getThemeColors(accentColor, backgroundColor)
	colors.accentColor = accentColor

	// Use stats.topProjects for Modrinth (sorted by downloads), or fall back to projects (already sorted for Hangar)
	const projectsToUse = stats.topProjects || projects
	const topProjects = showProjects ? projectsToUse.slice(0, maxProjects) : []
	const hasProjects = showProjects && topProjects.length > 0

	// Calculate summary
	const summaryText = organization.description
	const { svg: summarySvg, height: summaryHeight } = generateSummary(
		summaryText,
		colors,
		animations,
	)
	const summaryOffset = showSummary && summaryHeight > 0 ? summaryHeight : 0

	const height = hasProjects
		? 150 + topProjects.length * 50 + summaryOffset
		: summaryOffset > 0
			? 130 + summaryOffset
			: 130

	// Map projects to standard format for display
	const mappedProjects = topProjects.map((project) => ({
		title: project.title || project.name,
		slug: project.slug,
		description: project.description,
		downloads: project.downloads,
		followers: project.followers || 0,
		date: project.date_created || project.createdAt,
		icon_url_base64: project.icon_url_base64 || project.icon || null,
		project_type: project.project_type || 'mod',
		loaders: project.loaders || [],
		game_versions: project.game_versions || [],
		categories: project.categories || [],
		versionDates: project.versionDates || [],
	}))

	// Get all version dates for sparkline
	const allVersionDates = stats.allVersionDates || []

	// Get stat configs from platform config
	const statConfigs = getStatConfigs(platformConfig.id, 'organization')
	const statsData = statConfigs
		? statConfigs.map((config, index) => {
				const xPositions = [15, 155, 270]
				const value = stats[config.field]
				const displayValue = value == null ? 'N/A' : formatNumber(value)
				return { x: xPositions[index], label: config.label, value: displayValue }
			})
		: []

	const title = organization.name || organization.title || 'Unknown Organization'

	const bottomDelay = calculateBottomDelay(mappedProjects.length)

	const content = `
${showSparklines ? generateActivitySparkline(allVersionDates, colors, animations) : ''}
${generateHeader('organization', 'building', title, colors, platformConfig.icon(colors.accentColor), platformConfig.iconViewBox)}
${generateProfileImage(organization.icon_url_base64 || organization.avatarUrl || null, 'profile-clip', 400, 60, 35, colors, animations)}
${generateStatsGrid(statsData, colors, animations)}
${generateDivider(colors, animations)}
${showSummary ? summarySvg : ''}
${generateProjectList(mappedProjects, platformConfig.labels.sections.topProjects, colors, showSparklines, showDownloadBars, animations, summaryOffset)}
${generateInfo(height, colors, fromCache, animations, bottomDelay)}
${generateAttribution(height, colors, animations, bottomDelay)}
`

	return generateSvgWrapper(450, height, colors, content, showBorder, animations)
}
