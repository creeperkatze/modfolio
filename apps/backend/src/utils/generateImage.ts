import { Resvg, type ResvgRenderOptions } from '@resvg/resvg-js'
import { readdirSync } from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

// Load font files
const fontsDir = path.join(process.cwd(), 'public', 'fonts')

const fontFiles = readdirSync(fontsDir)
	.filter((file) => /\.(ttf|otf|woff2)$/i.test(file))
	.map((file) => path.join(fontsDir, file))

export async function generatePng(svgString: string) {
	const startTime = performance.now()

	const options: ResvgRenderOptions = {
		fitTo: {
			mode: 'width',
			value: 800,
		},
		font: {
			loadSystemFonts: false,
			fontFiles: fontFiles,
			defaultFontFamily: 'Inter',
		},
	}

	const resvg = new Resvg(svgString, options)
	const pngData = resvg.render()
	const pngBuffer = pngData.asPng()

	const renderTime = performance.now() - startTime

	return { buffer: pngBuffer, renderTime }
}
