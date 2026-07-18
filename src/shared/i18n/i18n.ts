import { type i18n as I18nInstance, createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { readPreference, writePreference } from '@/shared/lib'
import { EN, RU } from '@/shared/i18n/resources'

export const SUPPORTED_LOCALES = ['en', 'ru'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_PREFERENCE = 'locale'
const FALLBACK_LOCALE: Locale = 'en'

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

export const I18N: I18nInstance = createInstance()
const REGISTER_I18N_PLUGIN = I18N.use.bind(I18N)

function applyDocumentLocale(locale: Locale): void {
	document.documentElement.lang = locale
}

export async function initializeI18n(): Promise<void> {
	if (!I18N.isInitialized) {
		await REGISTER_I18N_PLUGIN(initReactI18next).init({
			fallbackLng: FALLBACK_LOCALE,
			interpolation: { escapeValue: false },
			lng: resolveInitialLocale(),
			resources: {
				en: { translation: EN },
				ru: { translation: RU },
			},
			supportedLngs: SUPPORTED_LOCALES,
		})
	}

	applyDocumentLocale(normalizeLocale(I18N.resolvedLanguage) ?? FALLBACK_LOCALE)
}

export async function changeLocale(locale: Locale): Promise<void> {
	await I18N.changeLanguage(locale)
	writePreference(LOCALE_PREFERENCE, locale)
	applyDocumentLocale(locale)
}
