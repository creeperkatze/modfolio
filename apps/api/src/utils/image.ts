import { fileTypeFromBuffer } from 'file-type'
import { performance } from 'perf_hooks'
import sharp from 'sharp'

import { MAX_CONCURRENT_REQUESTS, USER_AGENT } from '../config/env.js'
import { pLimit, requestDeduplicator } from './asyncUtils.js'
import logger from './logger.js'

// Detects the real mime type and, if requested, converts to PNG.
async function encodeImageBuffer(buffer: Buffer, convertToPng: boolean) {
	const detectedType = await fileTypeFromBuffer(buffer)

	let finalBuffer: Buffer<ArrayBufferLike> = buffer
	let mimeType = detectedType?.mime || 'image/png'
	let conversionTime = 0

	if (convertToPng && detectedType?.mime !== 'image/png') {
		const startTime = performance.now()
		finalBuffer = await sharp(buffer).png().toBuffer()
		conversionTime = performance.now() - startTime
		mimeType = 'image/png'
	}

	const base64 = finalBuffer.toString('base64')
	return { data: `data:${mimeType};base64,${base64}`, conversionTime }
}

export async function fetchImageAsBase64(url, convertToPng = false) {
	if (!url) return null

	return requestDeduplicator.dedupe(`image:${url}:${convertToPng}`, async () => {
		try {
			const response = await fetch(url, {
				headers: { 'User-Agent': USER_AGENT },
			})
			if (!response.ok) return null

			const arrayBuffer = await response.arrayBuffer()
			return await encodeImageBuffer(Buffer.from(arrayBuffer), convertToPng)
		} catch (error) {
			logger.warn({ err: error, url, convertToPng }, 'Error fetching image')
			return null
		}
	})
}

// Encodes an inline base64 image (e.g. Spiget's icon.data) without a network fetch.
export async function decodeBase64Image(base64: string | null | undefined, convertToPng = false) {
	if (!base64) return null

	try {
		return await encodeImageBuffer(Buffer.from(base64, 'base64'), convertToPng)
	} catch (error) {
		logger.warn({ err: error, convertToPng }, 'Error decoding inline image data')
		return null
	}
}

// Sets entity[field] to the fetched image's base64 data URI; returns conversion time for timing accumulation.
export async function enrichImage(
	entity: Record<string, any>,
	url: string | null | undefined,
	field: string,
	convertToPng = false,
	fallbackUrl: string | null = null,
): Promise<number> {
	if (!url) return 0

	let result = await fetchImageAsBase64(url, convertToPng)
	if (!result?.data && fallbackUrl) {
		result = await fetchImageAsBase64(fallbackUrl, convertToPng)
	}

	entity[field] = result?.data
	return result?.conversionTime || 0
}

// Like enrichImage, but decodes inline base64 first, falling back to a fetch of fallbackUrl if empty.
export async function enrichImageFromBase64(
	entity: Record<string, any>,
	base64: string | null | undefined,
	field: string,
	convertToPng = false,
	fallbackUrl: string | null = null,
): Promise<number> {
	const result = await decodeBase64Image(base64, convertToPng)
	if (result?.data) {
		entity[field] = result.data
		return result.conversionTime || 0
	}

	return enrichImage(entity, fallbackUrl, field, convertToPng)
}

export async function fetchImagesForProjects(projects, convertToPng = false) {
	let totalConversionTime = 0

	const tasks = projects
		.filter((project) => project.icon_url)
		.map((project) => async () => {
			const result = await fetchImageAsBase64(project.icon_url, convertToPng)
			project.icon_url_base64 = result?.data
			if (result?.conversionTime) totalConversionTime += result.conversionTime
		})

	await pLimit(tasks, MAX_CONCURRENT_REQUESTS)
	return totalConversionTime
}

export async function fetchVersionDatesForProjects(projects, getVersionsFunc) {
	const allVersionDates = []

	const tasks = projects.map((project) => async () => {
		try {
			const cacheKey = `versions:${project.id || project.slug}`
			const versions = await requestDeduplicator.dedupe(cacheKey, () =>
				getVersionsFunc(project.id || project.slug),
			)
			const versionDates = versions.map((v) => v.date_published)
			allVersionDates.push(...versionDates)
			project.versionDates = versionDates
		} catch {
			project.versionDates = []
		}
	})

	await pLimit(tasks, MAX_CONCURRENT_REQUESTS)

	return allVersionDates
}
