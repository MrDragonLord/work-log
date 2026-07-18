import { createContext, useContext } from 'react'

import { type Theme } from '@/features/preferences/theme/theme'

export type ThemeContextValue = {
	setTheme: (theme: Theme) => void
	theme: Theme
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
	const value = useContext(ThemeContext)

	if (value === null) {
		throw new Error('useTheme must be used inside ThemeProvider')
	}

	return value
}
