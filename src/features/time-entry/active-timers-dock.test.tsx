import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type TimeEntry, listActiveTimeEntries, stopTimeEntry } from '@/shared/api'
import { I18N, initializeI18n } from '@/shared/i18n'

import ActiveTimersDock from './active-timers-dock'

vi.mock('@/shared/api', () => ({
	WORKLOG_QUERY_KEYS: {
		activeTimeEntries: ['timeEntries', 'active'],
	},
	listActiveTimeEntries: vi.fn(),
	stopTimeEntry: vi.fn(),
}))

const ACTIVE_TIMER: TimeEntry = {
	description: null,
	elapsedMilliseconds: 42_000,
	endedAt: null,
	id: 'entry-1',
	projectId: 'project-1',
	projectDescription: null,
	projectName: 'Desktop app',
	runningSince: '2026-07-19T10:00:00.000Z',
	startedAt: '2026-07-19T09:59:18.000Z',
	title: 'Write review',
	workspaceId: 'workspace-1',
	workspaceName: 'WorkLog',
}

function TestProviders({ children }: { children: ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	})

	return (
		<I18nextProvider i18n={I18N}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</I18nextProvider>
	)
}

describe('ActiveTimersDock', () => {
	beforeEach(async () => {
		await initializeI18n()
		await I18N.changeLanguage('en')
		vi.mocked(stopTimeEntry).mockResolvedValue(ACTIVE_TIMER)
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('does not take up space when no timers are active', async () => {
		vi.mocked(listActiveTimeEntries).mockResolvedValue([])
		render(<ActiveTimersDock />, { wrapper: TestProviders })

		await waitFor(() => expect(listActiveTimeEntries).toHaveBeenCalledOnce())
		expect(
			screen.queryByRole('button', { name: 'Open running timers (0)' }),
		).not.toBeInTheDocument()
	})

	it('opens a panel with each active timer and its stop action', async () => {
		vi.mocked(listActiveTimeEntries).mockResolvedValue([ACTIVE_TIMER])
		const user = userEvent.setup()
		render(<ActiveTimersDock />, { wrapper: TestProviders })

		const trigger = await screen.findByRole('button', { name: 'Open running timers (1)' })
		await user.click(trigger)

		expect(await screen.findByText('Write review')).toBeVisible()
		expect(screen.getByText('WorkLog / Desktop app')).toBeVisible()
		const stopButton = screen.getByRole('button', { name: 'Stop “Write review” timer' })
		expect(stopButton).toBeEnabled()

		await user.click(stopButton)
		expect(vi.mocked(stopTimeEntry).mock.calls[0]?.[0]).toBe(ACTIVE_TIMER.id)
	})

	it('reserves space for the floating trigger when timers are active', async () => {
		vi.mocked(listActiveTimeEntries).mockResolvedValue([ACTIVE_TIMER])
		render(<ActiveTimersDock />, { wrapper: TestProviders })

		const trigger = await screen.findByRole('button', { name: 'Open running timers (1)' })
		expect(trigger).toBeVisible()
		expect(trigger).toHaveAttribute('data-slot', 'active-timers-dock')
		expect(trigger).toHaveClass('size-11', 'sm:size-14')
		expect(document.querySelector('[data-slot="active-timers-dock-spacer"]')).toBeInTheDocument()
	})
})
