import { createI18n } from 'vue-i18n'

import { LOCALES } from './locales.js'

const LOCALE_CODES = new Set(LOCALES.map((l) => l.code))

/**
 * Transform Crowdin JSON format ({ key: { message: "..." } }) to flat
 * vue-i18n messages ({ key: "..." }).
 */
function transformCrowdinMessages(messages) {
	const result = {}
	for (const [key, value] of Object.entries(messages)) {
		if (typeof value === 'string') {
			result[key] = value
		} else if (value && typeof value === 'object') {
			result[key] = value.message || value.defaultMessage || key
		}
	}
	return result
}

const localeModules = import.meta.glob('../locales/*/*.json', { eager: true })

function buildMessages() {
	const messages = {}
	for (const [path, module] of Object.entries(localeModules)) {
		const match = path.match(/\/([^/]+)\/[^/]+\.json$/)
		if (match && LOCALE_CODES.has(match[1])) {
			const locale = match[1]
			if (!messages[locale]) messages[locale] = {}
			Object.assign(messages[locale], transformCrowdinMessages(module.default))
		}
	}
	return messages
}

export const i18n = createI18n({
	legacy: false,
	locale: 'en-US',
	fallbackLocale: 'en-US',
	missingWarn: false,
	fallbackWarn: false,
	messages: buildMessages(),
})

export function detectBrowserLocale() {
	const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
	for (const lang of langs) {
		const exact = LOCALES.find((l) => l.code.toLowerCase() === lang.toLowerCase())
		if (exact) return exact.code
		const prefix = lang.split('-')[0].toLowerCase()
		const match = LOCALES.find((l) => l.code.split('-')[0].toLowerCase() === prefix)
		if (match) return match.code
	}
	return 'en-US'
}

/**
 * Identity functions used as markers for @formatjs/cli message extraction.
 * These are recognised by `formatjs extract` without any extra configuration.
 */
export function defineMessage(descriptor) {
	return descriptor
}

export function defineMessages(descriptors) {
	return descriptors
}
