import { readPreference, writePreference } from '@/shared/lib'

export type Theme = 'dark' | 'light'

const THEME_PREFERENCE = 'theme'

type ThemeResolutionOptions = {
	prefersDark?: boolean
	storedTheme?: string | null
}

function prefersDarkTheme(): boolean {
	return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function resolveInitialTheme(options: ThemeResolutionOptions = {}): Theme {
	const storedTheme =
		options.storedTheme === undefined ? readPreference(THEME_PREFERENCE) : options.storedTheme

	if (storedTheme === 'dark' || storedTheme === 'light') {
		return storedTheme
	}

	const prefersDark = options.prefersDark ?? prefersDarkTheme()
	return prefersDark ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle('dark', theme === 'dark')
	document.documentElement.style.colorScheme = theme
}

export function persistTheme(theme: Theme): void {
	writePreference(THEME_PREFERENCE, theme)
}
