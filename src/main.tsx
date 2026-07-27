import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App, AppProviders } from '@/app'
import { applyTheme, resolveInitialTheme } from '@/features/preferences/theme'
import { initializeLocale } from '@/shared/i18n'

import '@/index.css'

function bootstrap(): void {
	const rootElement = document.getElementById('root')

	if (rootElement === null) {
		throw new Error('Root element was not found')
	}

	applyTheme(resolveInitialTheme())
	initializeLocale()

	createRoot(rootElement).render(
		<StrictMode>
			<AppProviders>
				<App />
			</AppProviders>
		</StrictMode>,
	)
}

try {
	bootstrap()
} catch (error: unknown) {
	console.error('Failed to start WorkLog', error)
}
