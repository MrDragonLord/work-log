import { describe, expect, it, vi } from 'vitest'

import * as m from '@/paraglide/messages.js'

import {
	changeLocale,
	getActiveLocale,
	initializeLocale,
	normalizeLocale,
	resolveInitialLocale,
	subscribeToLocaleChanges,
} from '@/shared/i18n'

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

describe('compiled messages', () => {
	it('uses the active locale in Paraglide and the document', async () => {
		await changeLocale('ru')

		expect(initializeLocale()).toBe('ru')
		expect(document.documentElement.lang).toBe('ru')
		expect(m.appTagline()).toBe('Учёт времени')
	})

	it('updates direct message calls without reloading the page', async () => {
		const onLocaleChange = vi.fn()
		const unsubscribe = subscribeToLocaleChanges(onLocaleChange)

		await changeLocale('en')

		expect(getActiveLocale()).toBe('en')
		expect(document.documentElement.lang).toBe('en')
		expect(m.appTagline()).toBe('Time tracking')
		expect(onLocaleChange).toHaveBeenCalledOnce()

		unsubscribe()
	})

	it('selects English plural forms', () => {
		expect(m.runningTimersCount({ count: 1 }, { locale: 'en' })).toBe('1 active timer')
		expect(m.runningTimersCount({ count: 2 }, { locale: 'en' })).toBe('2 active timers')
	})

	it('selects Russian plural forms', () => {
		expect(m.runningTimersCount({ count: 1 }, { locale: 'ru' })).toBe('1 активный таймер')
		expect(m.runningTimersCount({ count: 2 }, { locale: 'ru' })).toBe('2 активных таймера')
		expect(m.runningTimersCount({ count: 5 }, { locale: 'ru' })).toBe('5 активных таймеров')
	})
})
