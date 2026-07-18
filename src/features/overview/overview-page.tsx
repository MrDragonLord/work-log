import { ArrowTopRightOnSquareIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { TimeEntryActions, useNow } from '@/features/time-entry'
import {
	type ProjectReference,
	type TimeEntry,
	WORKLOG_QUERY_KEYS,
	type WorkspaceReference,
	listTimeEntriesBetween,
} from '@/shared/api'
import {
	formatDuration,
	formatDurationMilliseconds,
	getDurationMilliseconds,
	getLocalDayRange,
} from '@/shared/lib'

const DAY_RANGE = getLocalDayRange()

type OverviewPageProps = {
	onOpenProject: (workspace: WorkspaceReference, project: ProjectReference) => void
}

function getProjectReference(entry: TimeEntry): ProjectReference {
	return {
		description: entry.projectDescription,
		id: entry.projectId,
		name: entry.projectName,
		workspaceId: entry.workspaceId,
	}
}

function getWorkspaceReference(entry: TimeEntry): WorkspaceReference {
	return {
		id: entry.workspaceId,
		name: entry.workspaceName,
	}
}

export default function OverviewPage({ onOpenProject }: OverviewPageProps) {
	const { i18n, t } = useTranslation()
	const entriesQuery = useQuery({
		queryFn: () => listTimeEntriesBetween(DAY_RANGE.start, DAY_RANGE.end),
		queryKey: WORKLOG_QUERY_KEYS.timeEntries(DAY_RANGE.start, DAY_RANGE.end),
	})
	const entries = entriesQuery.data ?? []
	const hasRunningEntry = entries.some((entry) => entry.runningSince !== null)
	const now = useNow(hasRunningEntry)
	const locale = i18n.resolvedLanguage ?? 'en'
	const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date())
	const timeFormatter = new Intl.DateTimeFormat(locale, {
		hour: '2-digit',
		minute: '2-digit',
	})
	const totalDuration = entries.reduce(
		(total, entry) =>
			total + getDurationMilliseconds(entry.elapsedMilliseconds, entry.runningSince, now),
		0,
	)

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
			<section className="min-w-0">
				<p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
					{t('screens.overview.eyebrow')}
				</p>
				<h1 className="mt-3 max-w-3xl font-heading text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl">
					{t('screens.overview.title')}
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					{t('screens.overview.description')}
				</p>

				<div className="mt-8 overflow-hidden rounded-2xl border bg-card">
					<div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
						<ClockIcon aria-hidden="true" className="size-4 text-primary" />
						<p className="font-heading text-sm font-semibold first-letter:uppercase">
							{formattedDate}
						</p>
					</div>

					{entriesQuery.isPending ? (
						<div className="grid min-h-56 place-items-center px-6 text-sm text-muted-foreground">
							{t('common.loading')}
						</div>
					) : null}

					{entriesQuery.isError ? (
						<div className="grid min-h-56 place-items-center px-6 text-center text-sm text-destructive">
							{t('common.error')}
						</div>
					) : null}

					{entriesQuery.isSuccess && entries.length === 0 ? (
						<div className="relative grid min-h-56 place-items-center px-6 py-12 text-center">
							<div
								aria-hidden="true"
								className="absolute inset-y-0 left-9 hidden w-px bg-border sm:block"
							/>
							<div className="max-w-sm">
								<div className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
									<ClockIcon aria-hidden="true" className="size-5" />
								</div>
								<h2 className="mt-4 font-heading text-base font-semibold">
									{t('screens.overview.emptyTitle')}
								</h2>
								<p className="mt-1.5 text-sm leading-6 text-muted-foreground">
									{t('screens.overview.emptyDescription')}
								</p>
							</div>
						</div>
					) : null}

					{entries.length > 0 ? (
						<div className="divide-y">
							{entries.map((entry) => (
								<article
									className="flex items-center gap-2 px-5 py-3 sm:gap-3 sm:px-6"
									key={entry.id}
								>
									<button
										aria-label={t('projectEntries.openProjectNamed', { name: entry.projectName })}
										className="group min-w-0 flex-1 rounded-md py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										onClick={() =>
											onOpenProject(getWorkspaceReference(entry), getProjectReference(entry))
										}
										type="button"
									>
										<div className="flex items-center gap-2">
											<h2 className="truncate text-sm font-semibold">{entry.title}</h2>
											{entry.runningSince !== null ? (
												<span className="size-2 shrink-0 rounded-full bg-running" />
											) : null}
											<ArrowTopRightOnSquareIcon
												aria-hidden="true"
												className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
											/>
										</div>
										<p className="mt-1 truncate text-xs text-muted-foreground">
											{entry.workspaceName} / {entry.projectName} ·{' '}
											{timeFormatter.format(new Date(entry.startedAt))}
										</p>
									</button>
									<time className="shrink-0 font-mono text-sm font-semibold text-timer">
										{formatDuration(entry.elapsedMilliseconds, entry.runningSince, now)}
									</time>
									<TimeEntryActions entry={entry} />
								</article>
							))}
						</div>
					) : null}
				</div>
			</section>

			<aside className="hidden border-l pl-6 lg:block">
				<div className="flex h-full min-h-72 flex-col justify-between py-1">
					<div>
						<p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
							{t('screens.overview.total')}
						</p>
						<p className="mt-3 font-mono text-[2.6rem] leading-none font-semibold tracking-[-0.06em] text-timer">
							{formatDurationMilliseconds(totalDuration)}
						</p>
					</div>
					<div className="space-y-3" aria-hidden="true">
						<div className="h-px bg-border" />
						<div className="h-px w-4/5 bg-border" />
						<div className="h-px w-3/5 bg-border" />
					</div>
				</div>
			</aside>
		</div>
	)
}
