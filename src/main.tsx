import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App, AppProviders } from '@/app'
import { applyTheme, resolveInitialTheme } from '@/features/preferences/theme'
import { initializeI18n } from '@/shared/i18n'

import '@/index.css'

async function bootstrap(): Promise<void> {
	const rootElement = document.getElementById('root')

	if (rootElement === null) {
		throw new Error('Root element was not found')
	}

	applyTheme(resolveInitialTheme())
	await initializeI18n()

	createRoot(rootElement).render(
		<StrictMode>
			<AppProviders>
				<App />
			</AppProviders>
		</StrictMode>,
	)
}

bootstrap().catch((error: unknown) => {
	console.error('Failed to start WorkLog', error)
})
