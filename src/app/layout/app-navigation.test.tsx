import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AppNavigation from './app-navigation'

describe('AppNavigation', () => {
	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('shows only primary sections and switches to workspaces', async () => {
		const onNavigate = vi.fn()
		const user = userEvent.setup()
		render(<AppNavigation activeSection="overview" onNavigate={onNavigate} />)

		expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('button', { name: 'Workspaces' })).toBeVisible()
		expect(screen.queryByRole('button', { name: /show workspaces/i })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Workspaces' }))

		expect(onNavigate).toHaveBeenCalledWith('workspaces')
	})
})
