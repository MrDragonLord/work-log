import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type TimeEntry, listTimeEntriesBetween } from '@/shared/api'

import OverviewPage from './overview-page'

vi.mock('@/features/time-entry', () => ({
	TimeEntryActions: () => <span data-testid="time-entry-actions" />,
	useNow: () => Date.now(),
}))

vi.mock('@/shared/api', () => ({
	WORKLOG_QUERY_KEYS: {
		timeEntries: (startedAfter: string, endedBefore: string) => [
			'timeEntries',
			'range',
			startedAfter,
			endedBefore,
		],
	},
	listTimeEntriesBetween: vi.fn(),
}))

const TIME_ENTRY: TimeEntry = {
	description: null,
	elapsedMilliseconds: 42_000,
	endedAt: null,
	id: 'entry-1',
	projectDescription: 'Desktop client work',
	projectId: 'project-1',
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

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('OverviewPage', () => {
	beforeEach(() => {
		vi.mocked(listTimeEntriesBetween).mockResolvedValue([TIME_ENTRY])
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('opens the time entry project with its workspace context', async () => {
		const onOpenProject = vi.fn()
		const user = userEvent.setup()
		render(<OverviewPage onOpenProject={onOpenProject} />, { wrapper: TestProviders })

		const projectButton = await screen.findByRole('button', {
			name: 'Open project “Desktop app”',
		})
		await user.click(projectButton)

		expect(onOpenProject).toHaveBeenCalledWith(
			{ id: 'workspace-1', name: 'WorkLog' },
			{
				description: 'Desktop client work',
				id: 'project-1',
				name: 'Desktop app',
				workspaceId: 'workspace-1',
			},
		)
		expect(screen.getByTestId('time-entry-actions')).toBeVisible()
	})
})
