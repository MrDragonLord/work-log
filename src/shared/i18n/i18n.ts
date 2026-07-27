import {
	type Locale,
	defineCustomClientStrategy,
	getLocale,
	locales,
	setLocale,
} from '@/paraglide/runtime.js'

import { readPreference, writePreference } from '@/shared/lib'

export const SUPPORTED_LOCALES = locales

const LOCALE_PREFERENCE = 'locale'
const FALLBACK_LOCALE: Locale = 'en'
const WORKLOG_LOCALE_STRATEGY = 'custom-worklogPreference'

let isLocaleStrategyInitialized = false
let activeLocale: Locale | null = null

const localeListeners = new Set<() => void>()

function getPreferredLanguages(): readonly string[] {
	if (typeof navigator === 'undefined') {
		return []
	}

	return navigator.languages.length > 0 ? navigator.languages : [navigator.language]
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
	const language = value?.trim().toLowerCase().split(/[-_]/)[0]

	if (language === 'en' || language === 'ru') {
		return language
	}

	return null
}

type LocaleResolutionOptions = {
	preferredLanguages?: readonly string[]
	storedLocale?: string | null
}

export function resolveInitialLocale(options: LocaleResolutionOptions = {}): Locale {
	const storedLocale =
		options.storedLocale === undefined ? readPreference(LOCALE_PREFERENCE) : options.storedLocale
	const savedLocale = normalizeLocale(storedLocale)

	if (savedLocale !== null) {
		return savedLocale
	}

	const preferredLanguages = options.preferredLanguages ?? getPreferredLanguages()

	for (const language of preferredLanguages) {
		const locale = normalizeLocale(language)

		if (locale !== null) {
			return locale
		}
	}

	return FALLBACK_LOCALE
}

function applyDocumentLocale(locale: Locale): void {
	document.documentElement.lang = locale
}

export function initializeLocale(): Locale {
	if (!isLocaleStrategyInitialized) {
		defineCustomClientStrategy(WORKLOG_LOCALE_STRATEGY, {
			getLocale: () => activeLocale ?? resolveInitialLocale(),
			setLocale: (locale) => {
				const selectedLocale = normalizeLocale(locale)

				if (selectedLocale !== null) {
					activeLocale = selectedLocale
					writePreference(LOCALE_PREFERENCE, selectedLocale)
				}
			},
		})
		isLocaleStrategyInitialized = true
	}

	const locale = getLocale()
	activeLocale = locale
	applyDocumentLocale(locale)

	return locale
}

export function getActiveLocale(): Locale {
	return activeLocale ?? initializeLocale()
}

export function subscribeToLocaleChanges(listener: () => void): () => void {
	localeListeners.add(listener)

	return () => {
		localeListeners.delete(listener)
	}
}

function notifyLocaleChange(): void {
	for (const listener of localeListeners) {
		listener()
	}
}

export async function changeLocale(locale: Locale): Promise<void> {
	initializeLocale()
	await setLocale(locale, { reload: false })
	applyDocumentLocale(locale)
	notifyLocaleChange()
}

export type { Locale }
