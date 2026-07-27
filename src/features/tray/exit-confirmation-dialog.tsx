import { type UnlistenFn, listen } from '@tauri-apps/api/event'
import { useMutation } from '@tanstack/react-query'
import { type MouseEvent, useEffect, useState } from 'react'
import { m } from '@/paraglide/messages.js'

import {
	EXIT_CONFIRMATION_REQUESTED_EVENT,
	type ExitConfirmationRequested,
	confirmApplicationExit,
} from '@/shared/api'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/shared/ui'

export default function ExitConfirmationDialog() {
	'use no memo'

	const [activeTimerCount, setActiveTimerCount] = useState<number | null>(null)
	const confirmExitMutation = useMutation({ mutationFn: confirmApplicationExit })

	useEffect(() => {
		let isDisposed = false
		let unlisten: UnlistenFn | undefined

		void listen<ExitConfirmationRequested>(EXIT_CONFIRMATION_REQUESTED_EVENT, ({ payload }) => {
			if (payload.activeTimerCount > 0) {
				setActiveTimerCount(payload.activeTimerCount)
			}
		}).then((nextUnlisten) => {
			if (isDisposed) {
				nextUnlisten()
				return
			}

			unlisten = nextUnlisten
		})

		return () => {
			isDisposed = true
			unlisten?.()
		}
	}, [])

	function cancelExit(): void {
		setActiveTimerCount(null)
	}

	function confirmExit(event: MouseEvent<HTMLButtonElement>): void {
		event.preventDefault()
		confirmExitMutation.mutate()
	}

	return (
		<AlertDialog
			onOpenChange={(isOpen) => !isOpen && !confirmExitMutation.isPending && cancelExit()}
			open={activeTimerCount !== null}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{m.actionsExitApplication()}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{m.actionsExitApplicationDescription({ count: activeTimerCount ?? 0 })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				{confirmExitMutation.isError ? (
					<p className="text-sm text-destructive" role="alert">
						{m.actionsExitApplicationError()}
					</p>
				) : null}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={confirmExitMutation.isPending} onClick={cancelExit}>
						{m.actionsCancel()}
					</AlertDialogCancel>
					<AlertDialogAction disabled={confirmExitMutation.isPending} onClick={confirmExit}>
						{confirmExitMutation.isPending
							? m.commonSaving()
							: m.actionsExitAndStopTimers()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
