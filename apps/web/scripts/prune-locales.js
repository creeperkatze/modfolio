import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '../src/locales')
const sourceLocale = 'en-US'

function prune(messages) {
	const pruned = {}
	for (const [key, value] of Object.entries(messages)) {
		if (typeof value === 'object' && value !== null) {
			const nested = prune(value)
			if (Object.keys(nested).length) pruned[key] = nested
		} else if (value !== '') {
			pruned[key] = value
		}
	}
	return pruned
}

for (const locale of readdirSync(localesDir)) {
	if (locale === sourceLocale) continue
	const dir = join(localesDir, locale)
	for (const file of readdirSync(dir)) {
		if (!file.endsWith('.json')) continue
		const path = join(dir, file)
		const content = readFileSync(path, 'utf8')
		const messages = prune(JSON.parse(content))
		if (Object.keys(messages).length) {
			const indent = content.match(/^[ \t]+(?=")/m)?.[0] ?? '\t'
			writeFileSync(path, `${JSON.stringify(messages, null, indent)}\n`)
		} else {
			rmSync(path)
		}
	}
	if (!readdirSync(dir).length) rmSync(dir, { recursive: true })
}
