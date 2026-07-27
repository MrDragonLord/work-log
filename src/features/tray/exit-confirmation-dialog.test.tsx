import { type UnlistenFn, listen } from '@tauri-apps/api/event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type ExitConfirmationRequested, confirmApplicationExit } from '@/shared/api'

import ExitConfirmationDialog from './exit-confirmation-dialog'

vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
	confirmApplicationExit: vi.fn(),
	EXIT_CONFIRMATION_REQUESTED_EVENT: 'worklog://exit-confirmation-requested',
}))

type ExitEventHandler = (event: { payload: ExitConfirmationRequested }) => void

function TestProviders({ children }: { children: ReactNode }) {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
		},
	})

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('ExitConfirmationDialog', () => {
	let eventHandler: ExitEventHandler | undefined
	let unlisten: UnlistenFn

	beforeEach(() => {
		eventHandler = undefined
		unlisten = vi.fn()
		vi.mocked(confirmApplicationExit).mockResolvedValue()
		vi.mocked(listen).mockImplementation((_event, handler) => {
			eventHandler = handler as unknown as ExitEventHandler
			return Promise.resolve(unlisten)
		})
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('shows a confirmation after the tray reports active timers', async () => {
		render(<ExitConfirmationDialog />, { wrapper: TestProviders })

		await waitFor(() => expect(vi.mocked(listen)).toHaveBeenCalledOnce())
		act(() => {
			eventHandler?.({ payload: { activeTimerCount: 2 } })
		})

		expect(await screen.findByRole('alertdialog')).toBeVisible()
		expect(
			screen.getByText('2 timers are running. They will be stopped when you exit.'),
		).toBeVisible()
	})

	it('stops active timers only after the user confirms exit', async () => {
		render(<ExitConfirmationDialog />, { wrapper: TestProviders })
		const user = userEvent.setup()

		await waitFor(() => expect(vi.mocked(listen)).toHaveBeenCalledOnce())
		act(() => {
			eventHandler?.({ payload: { activeTimerCount: 1 } })
		})

		await user.click(await screen.findByRole('button', { name: 'Exit and stop timers' }))

		expect(confirmApplicationExit).toHaveBeenCalledOnce()
	})

	it('dismisses the dialog without stopping timers when exit is cancelled', async () => {
		render(<ExitConfirmationDialog />, { wrapper: TestProviders })
		const user = userEvent.setup()

		await waitFor(() => expect(vi.mocked(listen)).toHaveBeenCalledOnce())
		act(() => {
			eventHandler?.({ payload: { activeTimerCount: 1 } })
		})

		await user.click(await screen.findByRole('button', { name: 'Cancel' }))

		expect(confirmApplicationExit).not.toHaveBeenCalled()
		expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
	})

	it('removes the native event listener on unmount', async () => {
		const view = render(<ExitConfirmationDialog />, { wrapper: TestProviders })

		await waitFor(() => expect(vi.mocked(listen)).toHaveBeenCalledOnce())
		view.unmount()

		expect(unlisten).toHaveBeenCalledOnce()
	})
})
