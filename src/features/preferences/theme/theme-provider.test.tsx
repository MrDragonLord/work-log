import { describe, expect, it } from 'vitest'

import { resolveInitialTheme } from '@/features/preferences/theme'

describe('resolveInitialTheme', () => {
	it('prefers the saved theme', () => {
		expect(resolveInitialTheme({ prefersDark: false, storedTheme: 'dark' })).toBe('dark')
	})

	it('uses the operating-system preference on first launch', () => {
		expect(resolveInitialTheme({ prefersDark: true, storedTheme: null })).toBe('dark')
		expect(resolveInitialTheme({ prefersDark: false, storedTheme: null })).toBe('light')
	})

	it('ignores an invalid saved value', () => {
		expect(resolveInitialTheme({ prefersDark: false, storedTheme: 'system' })).toBe('light')
	})
})
