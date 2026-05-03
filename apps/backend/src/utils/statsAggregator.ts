export function aggregateProjectStats(projects: any[], topCount = 5) {
	const totalDownloads = projects.reduce((sum, project) => sum + (project.downloads || 0), 0)
	const totalFollowers = projects.reduce((sum, project) => sum + (project.followers || 0), 0)
	const projectCount = projects.length

	const mostPopular = projects.reduce(
		(max, project) => ((project.downloads || 0) > (max.downloads || 0) ? project : max),
		projects[0] || null,
	)

	const topProjects = [...projects]
		.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
		.slice(0, topCount)

	const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0
	const engagementRatio =
		totalDownloads > 0 ? ((totalFollowers / totalDownloads) * 1000).toFixed(1) : 0

	return {
		totalDownloads,
		totalFollowers,
		projectCount,
		mostPopular,
		topProjects,
		avgDownloads,
		engagementRatio,
	}
}

export function aggregateProjectTypes(projects: any[]) {
	return projects.reduce(
		(acc, project) => {
			const types = Array.isArray(project.project_types)
				? project.project_types
				: [project.project_type || 'mod']

			types.forEach((type) => {
				acc[type] = (acc[type] || 0) + 1
			})
			return acc
		},
		{} as Record<string, number>,
	)
}

export function aggregateGameVersions(projects: any[], limit = 3) {
	const gameVersions: Record<string, number> = {}
	projects.forEach((project) => {
		if (project.game_versions && Array.isArray(project.game_versions)) {
			project.game_versions.forEach((version) => {
				gameVersions[version] = (gameVersions[version] || 0) + 1
			})
		}
	})

	return Object.entries(gameVersions)
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([version]) => version)
}

export function aggregateLoaders(projects: any[]) {
	const loaders: Record<string, number> = {}
	projects.forEach((project) => {
		if (project.loaders && Array.isArray(project.loaders)) {
			project.loaders.forEach((loader) => {
				loaders[loader] = (loaders[loader] || 0) + 1
			})
		}
	})
	return loaders
}

export function aggregateCategories(projects: any[], limit = 3) {
	const categories: Record<string, number> = {}
	projects.forEach((project) => {
		if (project.categories && Array.isArray(project.categories)) {
			project.categories.forEach((category) => {
				categories[category] = (categories[category] || 0) + 1
			})
		}
	})

	return Object.entries(categories)
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([category]) => category)
}

export function findRecentProject(projects: any[]) {
	return projects
		.filter((p) => p.published)
		.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime())[0]
}

export function normalizeV3ProjectFields(projects: any[]) {
	return projects.map((project) => ({
		...project,
		title: project.name || project.title,
		project_type: Array.isArray(project.project_types)
			? project.project_types[0]
			: project.project_type || 'mod',
	}))
}

// Combined aggregation - does all aggregations in a single pass for performance
export function aggregateAllStats(projects: any[], topCount = 5) {
	const projectTypes: Record<string, number> = {}
	const gameVersions: Record<string, number> = {}
	const loaders: Record<string, number> = {}
	const categories: Record<string, number> = {}
	let totalDownloads = 0
	let totalFollowers = 0
	let mostPopular = projects[0] || null
	let recentProject = null

	// Single pass through all projects
	projects.forEach((project) => {
		// Download and follower totals
		totalDownloads += project.downloads || 0
		totalFollowers += project.followers || 0

		// Most popular project
		if ((project.downloads || 0) > (mostPopular?.downloads || 0)) {
			mostPopular = project
		}

		// Recent project
		if (project.published) {
			if (!recentProject || new Date(project.published) > new Date(recentProject.published)) {
				recentProject = project
			}
		}

		// Project types
		const types = Array.isArray(project.project_types)
			? project.project_types
			: [project.project_type || 'mod']
		types.forEach((type) => {
			projectTypes[type] = (projectTypes[type] || 0) + 1
		})

		// Game versions
		if (project.game_versions && Array.isArray(project.game_versions)) {
			project.game_versions.forEach((version) => {
				gameVersions[version] = (gameVersions[version] || 0) + 1
			})
		}

		// Loaders
		if (project.loaders && Array.isArray(project.loaders)) {
			project.loaders.forEach((loader) => {
				loaders[loader] = (loaders[loader] || 0) + 1
			})
		}

		// Categories
		if (project.categories && Array.isArray(project.categories)) {
			project.categories.forEach((category) => {
				categories[category] = (categories[category] || 0) + 1
			})
		}
	})

	// Sort and get top projects
	const topProjects = [...projects]
		.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
		.slice(0, topCount)

	// Get top game versions and categories
	const topGameVersions = Object.entries(gameVersions)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([version]) => version)

	const topCategories = Object.entries(categories)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([category]) => category)

	const projectCount = projects.length
	const avgDownloads = projectCount > 0 ? Math.floor(totalDownloads / projectCount) : 0
	const engagementRatio =
		totalDownloads > 0 ? ((totalFollowers / totalDownloads) * 1000).toFixed(1) : 0

	return {
		totalDownloads,
		totalFollowers,
		projectCount,
		mostPopular,
		topProjects,
		avgDownloads,
		engagementRatio,
		projectTypes,
		topGameVersions,
		loaders,
		topCategories,
		recentProject,
	}
}
