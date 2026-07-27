import { ArrowLeftIcon, CalendarDaysIcon, ClockIcon, PlayIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import { type FormEvent, useState } from 'react'

import * as m from '@/paraglide/messages.js'

import { TimeEntryActions, useNow } from '@/features/time-entry'
import {
	type ProjectReference,
	WORKLOG_QUERY_KEYS,
	type WorkspaceReference,
	listProjectTimeEntries,
	startTimeEntry,
} from '@/shared/api'
import { useLocale } from '@/shared/i18n'
import { combineLocalDateAndTime, formatDuration, toTimeInputValue } from '@/shared/lib'
import {
	Button,
	Calendar,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
} from '@/shared/ui'

type ProjectTimersProps = {
	onBack: () => void
	project: ProjectReference
	workspace: WorkspaceReference
}

export default function ProjectTimers({ onBack, project, workspace }: ProjectTimersProps) {
	'use no memo'

	const locale = useLocale()
	const queryClient = useQueryClient()
	const [isCalendarOpen, setCalendarOpen] = useState(false)
	const [hasCustomStart, setHasCustomStart] = useState(false)
	const [isStartInvalid, setStartInvalid] = useState(false)
	const [description, setDescription] = useState('')
	const [startDate, setStartDate] = useState(() => new Date())
	const [startTime, setStartTime] = useState(() => toTimeInputValue())
	const [title, setTitle] = useState('')
	const entriesQuery = useQuery({
		queryFn: () => listProjectTimeEntries(project.id),
		queryKey: WORKLOG_QUERY_KEYS.projectTimeEntries(project.id),
	})
	const entries = entriesQuery.data ?? []
	const now = useNow(entries.some((entry) => entry.runningSince !== null))
	const currentDate = new Date()
	const calendarLocale = locale === 'ru' ? ru : enUS
	const isToday = startDate.toDateString() === currentDate.toDateString()
	const timeFormatter = new Intl.DateTimeFormat(locale, {
		dateStyle: 'medium',
		timeStyle: 'short',
	})
	const startMutation = useMutation({
		mutationFn: startTimeEntry,
		onSuccess: async () => {
			setDescription('')
			setHasCustomStart(false)
			setStartDate(new Date())
			setStartInvalid(false)
			setStartTime(toTimeInputValue())
			setTitle('')
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: WORKLOG_QUERY_KEYS.activeTimeEntries }),
				queryClient.invalidateQueries({
					queryKey: WORKLOG_QUERY_KEYS.projectTimeEntries(project.id),
				}),
				queryClient.invalidateQueries({ queryKey: ['timeEntries', 'range'] }),
			])
		},
	})
	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		if (title.trim().length === 0) {
			return
		}
		const parsedStart = hasCustomStart ? combineLocalDateAndTime(startDate, startTime) : new Date()
		if (parsedStart === null || parsedStart.getTime() > Date.now()) {
			setStartInvalid(true)
			return
		}

		setStartInvalid(false)
		startMutation.mutate({
			description,
			projectId: project.id,
			startedAt: parsedStart.toISOString(),
			title,
		})
	}

	return (
		<section>
			<Button onClick={onBack} variant="ghost">
				<ArrowLeftIcon aria-hidden="true" data-icon="inline-start" />
				{m.commonBackToProjects()}
			</Button>
			<p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
				{workspace.name}
			</p>
			<h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
				{project.name}
			</h1>
			{project.description ? (
				<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					{project.description}
				</p>
			) : null}

			<div className="mt-8 grid gap-6 xl:grid-cols-[23rem_minmax(0,1fr)]">
				<form className="h-fit rounded-2xl border bg-card p-5" onSubmit={handleSubmit}>
					<div className="flex items-center gap-3">
						<div className="grid size-10 place-items-center rounded-xl bg-running/12 text-running">
							<PlayIcon aria-hidden="true" className="size-5" />
						</div>
						<div>
							<h2 className="font-heading text-base font-semibold">{m.timerFormTitle()}</h2>
							<p className="text-xs text-muted-foreground">{m.timerFormParallelHint()}</p>
						</div>
					</div>
					<label className="mt-5 block text-sm font-medium" htmlFor="timer-title">
						{m.timerFormName()}
					</label>
					<Input
						className="mt-2"
						id="timer-title"
						maxLength={200}
						onChange={(event) => setTitle(event.target.value)}
						required
						value={title}
					/>
					<label className="mt-4 block text-sm font-medium" htmlFor="timer-description">
						{m.timerFormDescription()}
					</label>
					<Textarea
						className="mt-2"
						id="timer-description"
						maxLength={1000}
						onChange={(event) => setDescription(event.target.value)}
						value={description}
					/>
					<div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
						<div>
							<p className="text-sm font-medium">{m.timerFormDate()}</p>
							<Popover onOpenChange={setCalendarOpen} open={isCalendarOpen}>
								<PopoverTrigger asChild>
									<Button
										aria-invalid={isStartInvalid || undefined}
										className="mt-2 w-full justify-start font-normal"
										variant="outline"
									>
										<CalendarDaysIcon aria-hidden="true" data-icon="inline-start" />
										{format(startDate, 'PPP', { locale: calendarLocale })}
									</Button>
								</PopoverTrigger>
								<PopoverContent align="start" className="w-auto p-0">
									<Calendar
										disabled={{ after: currentDate }}
										locale={calendarLocale}
										mode="single"
										onSelect={(date) => {
											if (date !== undefined) {
												setCalendarOpen(false)
												setHasCustomStart(true)
												setStartDate(date)
												setStartInvalid(false)
											}
										}}
										selected={startDate}
										timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<label className="block text-sm font-medium" htmlFor="timer-start-time">
								{m.timerFormTime()}
							</label>
							<Input
								aria-invalid={isStartInvalid || undefined}
								className="mt-2 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
								id="timer-start-time"
								max={isToday ? toTimeInputValue(currentDate) : undefined}
								onChange={(event) => {
									setHasCustomStart(true)
									setStartInvalid(false)
									setStartTime(event.target.value)
								}}
								required
								type="time"
								step="1"
								value={startTime}
							/>
						</div>
					</div>
					{isStartInvalid || startMutation.isError ? (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{isStartInvalid ? m.timerFormFutureStart() : m.commonCheckFields()}
						</p>
					) : null}
					<Button className="mt-5 w-full" disabled={startMutation.isPending} type="submit">
						<PlayIcon aria-hidden="true" data-icon="inline-start" />
						{startMutation.isPending ? m.commonSaving() : m.timerFormSubmit()}
					</Button>
				</form>

				<div className="overflow-hidden rounded-2xl border bg-card">
					<div className="flex items-center gap-3 border-b px-5 py-4">
						<ClockIcon aria-hidden="true" className="size-4 text-primary" />
						<h2 className="font-heading text-sm font-semibold">{m.projectEntriesTitle()}</h2>
					</div>
					{entriesQuery.isPending ? (
						<p className="px-5 py-8 text-sm text-muted-foreground">{m.commonLoading()}</p>
					) : null}
					{entriesQuery.isError ? (
						<p className="px-5 py-8 text-sm text-destructive" role="alert">
							{m.commonError()}
						</p>
					) : null}
					{entriesQuery.isSuccess && entries.length === 0 ? (
						<p className="px-5 py-12 text-center text-sm text-muted-foreground">
							{m.projectEntriesEmpty()}
						</p>
					) : null}
					{entries.length > 0 ? (
						<div className="divide-y">
							{entries.map((entry) => (
								<article className="flex items-center gap-3 px-5 py-4" key={entry.id}>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<h3 className="truncate text-sm font-semibold">{entry.title}</h3>
											{entry.runningSince !== null ? (
												<span className="size-2 shrink-0 rounded-full bg-running" />
											) : null}
										</div>
										<p className="mt-1 text-xs text-muted-foreground">
											{timeFormatter.format(new Date(entry.startedAt))}
										</p>
									</div>
									<time className="font-mono text-sm font-semibold text-timer">
										{formatDuration(entry.elapsedMilliseconds, entry.runningSince, now)}
									</time>
									<TimeEntryActions entry={entry} />
								</article>
							))}
						</div>
					) : null}
				</div>
			</div>
		</section>
	)
}
