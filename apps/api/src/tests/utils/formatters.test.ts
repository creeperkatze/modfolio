import { describe, expect, it } from 'vitest'

import {
	escapeHtml,
	escapeXml,
	formatNumber,
	generateSparkline,
	truncateText,
} from '../../utils/formatters.js'

describe('formatNumber', () => {
	it('returns raw number as string below 1000', () => {
		expect(formatNumber(0)).toBe('0')
		expect(formatNumber(999)).toBe('999')
	})

	it('formats thousands with K suffix', () => {
		expect(formatNumber(1000)).toBe('1.0K')
		expect(formatNumber(1500)).toBe('1.5K')
		expect(formatNumber(999999)).toBe('1000.0K')
	})

	it('formats millions with M suffix', () => {
		expect(formatNumber(1000000)).toBe('1.0M')
		expect(formatNumber(2500000)).toBe('2.5M')
	})
})

describe('escapeXml', () => {
	it('escapes all XML special characters', () => {
		expect(escapeXml('&')).toBe('&amp;')
		expect(escapeXml('<')).toBe('&lt;')
		expect(escapeXml('>')).toBe('&gt;')
		expect(escapeXml('"')).toBe('&quot;')
		expect(escapeXml("'")).toBe('&apos;')
	})

	it('escapes a combined string', () => {
		expect(escapeXml('<tag attr="val" key=\'v\'>&</tag>')).toBe(
			'&lt;tag attr=&quot;val&quot; key=&apos;v&apos;&gt;&amp;&lt;/tag&gt;',
		)
	})

	it('leaves safe strings unchanged', () => {
		expect(escapeXml('hello world')).toBe('hello world')
	})
})

describe('escapeHtml', () => {
	it('escapes all HTML special characters', () => {
		expect(escapeHtml('&')).toBe('&amp;')
		expect(escapeHtml('<')).toBe('&lt;')
		expect(escapeHtml('>')).toBe('&gt;')
		expect(escapeHtml('"')).toBe('&quot;')
		expect(escapeHtml("'")).toBe('&#039;')
	})

	it('leaves safe strings unchanged', () => {
		expect(escapeHtml('hello world')).toBe('hello world')
	})
})

describe('truncateText', () => {
	it('returns original text when within limit', () => {
		expect(truncateText('hello', 10)).toBe('hello')
		expect(truncateText('hello', 5)).toBe('hello')
	})

	it('truncates and appends ellipsis when over limit', () => {
		expect(truncateText('hello world', 5)).toBe('hello...')
	})
})

describe('generateSparkline', () => {
	it('returns empty paths for null or empty input', () => {
		expect(generateSparkline(null)).toEqual({ path: '', fillPath: '' })
		expect(generateSparkline([])).toEqual({ path: '', fillPath: '' })
	})

	it('returns non-empty paths for valid dates', () => {
		const now = new Date()
		const dates = [
			new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
			new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
			new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
		]
		const result = generateSparkline(dates)
		expect(result.path).not.toBe('')
		expect(result.fillPath).not.toBe('')
	})

	it('fillPath is an extension of path', () => {
		const dates = [new Date().toISOString()]
		const result = generateSparkline(dates)
		expect(result.fillPath).toContain(result.path)
		expect(result.fillPath.endsWith('Z')).toBe(true)
	})

	it('ignores dates older than 30 days', () => {
		const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
		const result = generateSparkline([old])
		// All counts are 0, path still generates but stays at baseline
		expect(result.path).not.toBe('')
	})
})
