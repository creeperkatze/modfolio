import { createI18n } from 'vue-i18n'

import { LOCALES } from './locales'

interface CrowdinMessage {
	message?: string
	defaultMessage?: string
}

type CrowdinMessages = Record<string, string | CrowdinMessage>
type I18nMessages = Record<string, string>

export interface MessageDescriptor {
	id: string
	defaultMessage: string
}

const LOCALE_CODES = new Set(LOCALES.map((l) => l.code))

function transformCrowdinMessages(messages: CrowdinMessages): I18nMessages {
	const result: I18nMessages = {}
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
	const messages: Record<string, I18nMessages> = {}
	for (const [path, module] of Object.entries(localeModules)) {
		const match = path.match(/\/([^/]+)\/[^/]+\.json$/)
		if (match && LOCALE_CODES.has(match[1])) {
			const locale = match[1]
			if (!messages[locale]) messages[locale] = {}
			const jsonModule = module as { default: CrowdinMessages }
			Object.assign(messages[locale], transformCrowdinMessages(jsonModule.default))
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

export function detectBrowserLocale(): string {
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

export function defineMessage<T extends MessageDescriptor>(descriptor: T): T {
	return descriptor
}

export function defineMessages<T extends Record<string, MessageDescriptor>>(descriptors: T): T {
	return descriptors
}
