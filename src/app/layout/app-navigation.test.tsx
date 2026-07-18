import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18N, initializeI18n } from '@/shared/i18n'

import AppNavigation from './app-navigation'

describe('AppNavigation', () => {
	beforeEach(async () => {
		await initializeI18n()
		await I18N.changeLanguage('en')
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('shows only primary sections and switches to workspaces', async () => {
		const onNavigate = vi.fn()
		const user = userEvent.setup()
		render(
			<I18nextProvider i18n={I18N}>
				<AppNavigation activeSection="overview" onNavigate={onNavigate} />
			</I18nextProvider>,
		)

		expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('button', { name: 'Workspaces' })).toBeVisible()
		expect(screen.queryByRole('button', { name: /show workspaces/i })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Workspaces' }))

		expect(onNavigate).toHaveBeenCalledWith('workspaces')
	})
})
