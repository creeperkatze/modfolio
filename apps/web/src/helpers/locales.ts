export interface LocaleOption {
	code: string
	name: string
	dir?: 'ltr' | 'rtl'
}

export const LOCALES: LocaleOption[] = [{ code: 'en-US', name: 'English' }]
