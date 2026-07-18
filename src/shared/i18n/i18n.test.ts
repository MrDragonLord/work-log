import { describe, expect, it } from 'vitest'

import { normalizeLocale, resolveInitialLocale } from '@/shared/i18n'

describe('normalizeLocale', () => {
	it('normalizes supported regional locales', () => {
		expect(normalizeLocale('ru-RU')).toBe('ru')
		expect(normalizeLocale('en_US')).toBe('en')
	})

	it('rejects unsupported locales', () => {
		expect(normalizeLocale('de-DE')).toBeNull()
		expect(normalizeLocale(null)).toBeNull()
	})
})

describe('resolveInitialLocale', () => {
	it('prefers a saved supported locale', () => {
		expect(resolveInitialLocale({ preferredLanguages: ['en-US'], storedLocale: 'ru' })).toBe('ru')
	})

	it('uses the first supported operating-system locale', () => {
		expect(
			resolveInitialLocale({ preferredLanguages: ['de-DE', 'ru-RU'], storedLocale: null }),
		).toBe('ru')
	})

	it('falls back to English', () => {
		expect(resolveInitialLocale({ preferredLanguages: ['de-DE'], storedLocale: null })).toBe('en')
	})
})
