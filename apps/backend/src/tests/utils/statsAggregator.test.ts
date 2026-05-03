import { describe, expect, it } from 'vitest'

import {
	aggregateAllStats,
	aggregateCategories,
	aggregateGameVersions,
	aggregateLoaders,
	aggregateProjectStats,
	aggregateProjectTypes,
	findRecentProject,
	normalizeV3ProjectFields,
} from '../../utils/statsAggregator.js'

const makeProject = (overrides = {}) => ({
	downloads: 0,
	followers: 0,
	project_type: 'mod',
	game_versions: [],
	loaders: [],
	categories: [],
	...overrides,
})

describe('aggregateProjectStats', () => {
	it('sums downloads and followers', () => {
		const projects = [
			makeProject({ downloads: 1000, followers: 10 }),
			makeProject({ downloads: 2000, followers: 20 }),
		]
		const result = aggregateProjectStats(projects)
		expect(result.totalDownloads).toBe(3000)
		expect(result.totalFollowers).toBe(30)
	})

	it('returns correct project count', () => {
		const projects = [makeProject(), makeProject(), makeProject()]
		expect(aggregateProjectStats(projects).projectCount).toBe(3)
	})

	it('identifies most popular project', () => {
		const low = makeProject({ downloads: 100, title: 'low' })
		const high = makeProject({ downloads: 9999, title: 'high' })
		expect(aggregateProjectStats([low, high]).mostPopular).toBe(high)
	})

	it('returns top projects sorted by downloads', () => {
		const projects = [
			makeProject({ downloads: 100 }),
			makeProject({ downloads: 500 }),
			makeProject({ downloads: 300 }),
		]
		const { topProjects } = aggregateProjectStats(projects, 2)
		expect(topProjects[0].downloads).toBe(500)
		expect(topProjects[1].downloads).toBe(300)
		expect(topProjects.length).toBe(2)
	})

	it('calculates average downloads', () => {
		const projects = [makeProject({ downloads: 100 }), makeProject({ downloads: 300 })]
		expect(aggregateProjectStats(projects).avgDownloads).toBe(200)
	})

	it('returns zero averages for empty projects', () => {
		const result = aggregateProjectStats([])
		expect(result.totalDownloads).toBe(0)
		expect(result.avgDownloads).toBe(0)
		expect(result.engagementRatio).toBe(0)
	})
})

describe('aggregateProjectTypes', () => {
	it('counts project types', () => {
		const projects = [
			makeProject({ project_type: 'mod' }),
			makeProject({ project_type: 'mod' }),
			makeProject({ project_type: 'modpack' }),
		]
		const result = aggregateProjectTypes(projects)
		expect(result.mod).toBe(2)
		expect(result.modpack).toBe(1)
	})

	it('handles project_types array', () => {
		const project = { project_types: ['mod', 'plugin'] }
		const result = aggregateProjectTypes([project])
		expect(result.mod).toBe(1)
		expect(result.plugin).toBe(1)
	})
})

describe('aggregateGameVersions', () => {
	it('returns top versions by frequency', () => {
		const projects = [
			makeProject({ game_versions: ['1.20', '1.19'] }),
			makeProject({ game_versions: ['1.20', '1.18'] }),
			makeProject({ game_versions: ['1.20'] }),
		]
		const result = aggregateGameVersions(projects, 2)
		expect(result[0]).toBe('1.20')
		expect(result.length).toBe(2)
	})

	it('respects limit', () => {
		const projects = [makeProject({ game_versions: ['1.20', '1.19', '1.18', '1.17'] })]
		expect(aggregateGameVersions(projects, 2).length).toBe(2)
	})
})

describe('aggregateLoaders', () => {
	it('counts loaders across projects', () => {
		const projects = [
			makeProject({ loaders: ['fabric', 'quilt'] }),
			makeProject({ loaders: ['fabric'] }),
		]
		const result = aggregateLoaders(projects)
		expect(result.fabric).toBe(2)
		expect(result.quilt).toBe(1)
	})
})

describe('aggregateCategories', () => {
	it('returns top categories by frequency', () => {
		const projects = [
			makeProject({ categories: ['utility', 'adventure'] }),
			makeProject({ categories: ['utility'] }),
		]
		const result = aggregateCategories(projects, 1)
		expect(result[0]).toBe('utility')
		expect(result.length).toBe(1)
	})
})

describe('findRecentProject', () => {
	it('returns most recently published project', () => {
		const projects = [
			makeProject({ published: '2024-01-01', title: 'old' }),
			makeProject({ published: '2024-06-01', title: 'new' }),
			makeProject({ published: '2024-03-01', title: 'mid' }),
		]
		expect(findRecentProject(projects).title).toBe('new')
	})

	it('ignores projects without published date', () => {
		const projects = [
			makeProject({ title: 'no-date' }),
			makeProject({ published: '2024-01-01', title: 'dated' }),
		]
		expect(findRecentProject(projects).title).toBe('dated')
	})
})

describe('normalizeV3ProjectFields', () => {
	it('maps name to title', () => {
		const result = normalizeV3ProjectFields([{ name: 'My Mod' }])
		expect(result[0].title).toBe('My Mod')
	})

	it('uses first entry of project_types array', () => {
		const result = normalizeV3ProjectFields([{ project_types: ['modpack', 'mod'] }])
		expect(result[0].project_type).toBe('modpack')
	})

	it('falls back to project_type field', () => {
		const result = normalizeV3ProjectFields([{ project_type: 'plugin' }])
		expect(result[0].project_type).toBe('plugin')
	})
})

describe('aggregateAllStats', () => {
	it('returns all aggregated fields in a single pass', () => {
		const projects = [
			makeProject({
				downloads: 1000,
				followers: 50,
				project_type: 'mod',
				game_versions: ['1.20'],
				loaders: ['fabric'],
				categories: ['utility'],
				published: '2024-01-01',
			}),
			makeProject({
				downloads: 500,
				followers: 20,
				project_type: 'modpack',
				game_versions: ['1.19'],
				loaders: ['forge'],
				categories: ['adventure'],
				published: '2024-06-01',
			}),
		]

		const result = aggregateAllStats(projects)
		expect(result.totalDownloads).toBe(1500)
		expect(result.totalFollowers).toBe(70)
		expect(result.projectCount).toBe(2)
		expect(result.topProjects[0].downloads).toBe(1000)
		expect(result.projectTypes.mod).toBe(1)
		expect(result.projectTypes.modpack).toBe(1)
		expect(result.topGameVersions).toContain('1.20')
		expect(result.loaders.fabric).toBe(1)
		expect(result.topCategories).toContain('utility')
		expect(result.recentProject.published).toBe('2024-06-01')
	})
})
