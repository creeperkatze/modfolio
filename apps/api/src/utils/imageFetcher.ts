import { fileTypeFromBuffer } from 'file-type'
import { performance } from 'perf_hooks'
import sharp from 'sharp'

import { MAX_CONCURRENT_REQUESTS, USER_AGENT } from '../config/env.js'
import { pLimit, requestDeduplicator } from './asyncUtils.js'
import logger from './logger.js'

/** Detect the real mime type of `buffer` and, if requested, convert it to PNG. */
async function encodeImageBuffer(buffer: Buffer, convertToPng: boolean) {
	// Use file-type library for bulletproof file type detection
	const detectedType = await fileTypeFromBuffer(buffer)

	let finalBuffer: Buffer<ArrayBufferLike> = buffer
	let mimeType = detectedType?.mime || 'image/png'
	let conversionTime = 0

	// Only convert to PNG if specifically requested
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

	// Use request deduplication to prevent fetching the same image multiple times
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

/**
 * Encode a base64 string an upstream API already returned inline (e.g. Spiget's
 * `icon.data`), without an extra network request. Mirrors `fetchImageAsBase64`'s
 * output shape so callers can treat "image already in hand" and "image needs
 * fetching" the same way.
 */
export async function decodeBase64Image(base64: string | null | undefined, convertToPng = false) {
	if (!base64) return null

	try {
		return await encodeImageBuffer(Buffer.from(base64, 'base64'), convertToPng)
	} catch (error) {
		logger.warn({ err: error, convertToPng }, 'Error decoding inline image data')
		return null
	}
}

/**
 * Fetch `url`, base64-encode it, and assign the data URI onto `entity[field]`.
 * Returns the PNG-conversion time (0 when nothing was fetched or converted) so
 * callers can accumulate it into their `imageConversion` timing. Falls back to
 * `fallbackUrl` when the primary fetch yields no data (used by Spigot icons).
 */
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

/**
 * Like `enrichImage`, but for a base64 string the API already returned inline.
 * Falls back to `enrichImage(entity, fallbackUrl, ...)` when there is no inline
 * data (some Spiget resources genuinely have no icon either way).
 */
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

	// Use concurrency limiting to prevent overwhelming the API
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

	// Use concurrency limiting for version fetches
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
