import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	type TimeEntry,
	deleteTimeEntry,
	resumeTimeEntry,
	stopTimeEntry,
	updateTimeEntry,
} from '@/shared/api'
import { I18N, initializeI18n } from '@/shared/i18n'

import TimeEntryActions from './time-entry-actions'

vi.mock('@/shared/api', () => ({
	deleteTimeEntry: vi.fn(),
	resumeTimeEntry: vi.fn(),
	stopTimeEntry: vi.fn(),
	updateTimeEntry: vi.fn(),
}))

const STOPPED_ENTRY: TimeEntry = {
	description: null,
	elapsedMilliseconds: 42_000,
	endedAt: '2026-07-19T10:00:00.000Z',
	id: 'entry-1',
	projectDescription: null,
	projectId: 'project-1',
	projectName: 'Desktop app',
	runningSince: null,
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

describe('TimeEntryActions', () => {
	beforeEach(async () => {
		await initializeI18n()
		await I18N.changeLanguage('en')
		vi.mocked(deleteTimeEntry).mockResolvedValue()
		vi.mocked(resumeTimeEntry).mockResolvedValue({
			...STOPPED_ENTRY,
			runningSince: '2026-07-19T10:01:00.000Z',
		})
		vi.mocked(stopTimeEntry).mockResolvedValue(STOPPED_ENTRY)
		vi.mocked(updateTimeEntry).mockResolvedValue(STOPPED_ENTRY)
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('resumes a stopped entry', async () => {
		const user = userEvent.setup()
		render(<TimeEntryActions entry={STOPPED_ENTRY} />, { wrapper: TestProviders })

		await user.click(screen.getByRole('button', { name: 'Resume “Write review” timer' }))

		expect(vi.mocked(resumeTimeEntry).mock.calls[0]?.[0]).toBe(STOPPED_ENTRY.id)
	})

	it('opens the editor from the actions menu', async () => {
		const user = userEvent.setup()
		render(<TimeEntryActions entry={STOPPED_ENTRY} />, { wrapper: TestProviders })

		await user.click(screen.getByRole('button', { name: 'Open actions menu' }))
		await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))

		expect(await screen.findByRole('heading', { name: 'Edit time entry' })).toBeVisible()
	})
})
