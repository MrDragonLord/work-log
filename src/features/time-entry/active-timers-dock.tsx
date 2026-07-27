import { SignalIcon, StopIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { m } from '@/paraglide/messages.js'

import { WORKLOG_QUERY_KEYS, listActiveTimeEntries, stopTimeEntry } from '@/shared/api'
import { formatDuration } from '@/shared/lib'
import { Button, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui'

import useNow from './use-now'

const FLOATING_BUTTON_CLASS =
	'fixed right-3 bottom-3 z-30 size-11 rounded-full border-running/30 bg-card text-running shadow-[0_18px_42px_-20px_color-mix(in_oklch,var(--running),transparent_36%)] hover:border-running/55 hover:bg-card sm:right-7 sm:bottom-7 sm:size-14'

export default function ActiveTimersDock() {
	'use no memo'

	const queryClient = useQueryClient()
	const [isOpen, setOpen] = useState(false)
	const activeTimersQuery = useQuery({
		queryFn: listActiveTimeEntries,
		queryKey: WORKLOG_QUERY_KEYS.activeTimeEntries,
		refetchInterval: 30_000,
	})
	const stopTimerMutation = useMutation({
		mutationFn: stopTimeEntry,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
		},
	})
	const timers = activeTimersQuery.data ?? []
	const now = useNow(timers.length > 0)
	const error = activeTimersQuery.error ?? stopTimerMutation.error

	if (timers.length === 0 && error === null) {
		return null
	}

	return (
		<>
			<div aria-hidden="true" className="h-20 sm:h-24" data-slot="active-timers-dock-spacer" />
			<Button
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				aria-label={m.runningTimersOpen({ count: timers.length })}
				className={FLOATING_BUTTON_CLASS}
				data-slot="active-timers-dock"
				onClick={() => setOpen(true)}
				size="icon"
				variant="outline"
			>
				<span
					aria-hidden="true"
					className="absolute inset-1 rounded-full border border-running/20"
				/>
				<span
					aria-hidden="true"
					className="absolute inset-3 rounded-full border border-running/30"
				/>
				<SignalIcon aria-hidden="true" className="relative size-4 sm:size-5" />
				<span
					aria-hidden="true"
					className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-running px-1 py-0.5 text-[0.65rem] leading-none font-bold text-background"
				>
					{timers.length}
				</span>
			</Button>

			<Sheet onOpenChange={setOpen} open={isOpen}>
				<SheetContent
					className="w-[min(27rem,calc(100vw-2rem))] gap-0 p-0 sm:max-w-none"
					closeLabel={m.commonClose()}
					side="right"
				>
					<SheetHeader className="border-b px-5 py-5 pr-14 text-left">
						<div className="flex items-center gap-3">
							<div
								aria-hidden="true"
								className="grid size-9 place-items-center rounded-full bg-running/12 text-running"
							>
								<SignalIcon className="size-4" />
							</div>
							<div>
								<p className="text-[0.68rem] font-semibold tracking-[0.16em] text-running uppercase">
									{m.runningTimersEyebrow()}
								</p>
								<SheetTitle className="mt-1">
									{timers.length === 0
										? m.runningTimersNone()
										: m.runningTimersCount({ count: timers.length })}
								</SheetTitle>
							</div>
						</div>
						<SheetDescription>
							{m.runningTimersDescription()}
						</SheetDescription>
					</SheetHeader>

					<div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
						{timers.map((timer) => (
							<article
								className="flex min-w-0 items-center gap-3 rounded-xl border bg-background/55 px-4 py-3"
								key={timer.id}
							>
								<div className="min-w-0 flex-1">
									<h3 className="truncate text-sm font-semibold">{timer.title}</h3>
									<p className="mt-0.5 truncate text-xs text-muted-foreground">
										{timer.workspaceName} / {timer.projectName}
									</p>
								</div>
								<time
									className="shrink-0 font-mono text-base font-semibold tracking-[-0.03em] text-timer"
									dateTime={timer.startedAt}
								>
									{formatDuration(timer.elapsedMilliseconds, timer.runningSince, now)}
								</time>
								<Button
									aria-label={m.runningTimersStopNamed({ title: timer.title })}
									disabled={stopTimerMutation.isPending && stopTimerMutation.variables === timer.id}
									onClick={() => stopTimerMutation.mutate(timer.id)}
									size="icon"
									variant="destructive"
								>
									<StopIcon aria-hidden="true" />
								</Button>
							</article>
						))}

						{error ? (
							<p className="text-sm text-destructive" role="alert">
								{m.commonError()}
							</p>
						) : null}
					</div>
				</SheetContent>
			</Sheet>
		</>
	)
}
