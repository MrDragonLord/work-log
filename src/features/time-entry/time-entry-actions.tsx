import {
	EllipsisHorizontalIcon,
	PencilSquareIcon,
	PlayIcon,
	StopIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import * as m from '@/paraglide/messages.js'
import { useLocale } from '@/shared/i18n'

import {
	type TimeEntry,
	type UpdateTimeEntryInput,
	deleteTimeEntry,
	resumeTimeEntry,
	stopTimeEntry,
	updateTimeEntry,
} from '@/shared/api'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/shared/ui'

import DeleteTimeEntryDialog from './delete-time-entry-dialog'
import TimeEntryEditorDialog from './time-entry-editor-dialog'

type TimeEntryActionsProps = {
	entry: TimeEntry
	size?: 'icon' | 'icon-sm'
}

export default function TimeEntryActions({ entry, size = 'icon-sm' }: TimeEntryActionsProps) {
	'use no memo'

	useLocale()
	const queryClient = useQueryClient()
	const [isDeleting, setDeleting] = useState(false)
	const [isEditing, setEditing] = useState(false)
	const stopMutation = useMutation({
		mutationFn: stopTimeEntry,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
		},
	})
	const resumeMutation = useMutation({
		mutationFn: resumeTimeEntry,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
		},
	})
	const updateMutation = useMutation({
		mutationFn: (input: UpdateTimeEntryInput) => updateTimeEntry(entry.id, input),
		onSuccess: async () => {
			setEditing(false)
			await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
		},
	})
	const deleteMutation = useMutation({
		mutationFn: () => deleteTimeEntry(entry.id),
		onSuccess: async () => {
			setDeleting(false)
			await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
		},
	})

	return (
		<>
			{isEditing ? (
				<TimeEntryEditorDialog
					entry={entry}
					isSaving={updateMutation.isPending}
					onClose={() => setEditing(false)}
					onSave={(input) => updateMutation.mutate(input)}
				/>
			) : null}
			{isDeleting ? (
				<DeleteTimeEntryDialog
					entry={entry}
					isDeleting={deleteMutation.isPending}
					onCancel={() => setDeleting(false)}
					onConfirm={() => deleteMutation.mutate()}
				/>
			) : null}
			{entry.runningSince !== null ? (
				<Button
					aria-label={m.runningTimersStopNamed({ title: entry.title })}
					disabled={stopMutation.isPending}
					onClick={() => stopMutation.mutate(entry.id)}
					size={size}
					variant="destructive"
				>
					<StopIcon aria-hidden="true" />
				</Button>
			) : (
				<Button
					aria-label={m.runningTimersResumeNamed({ title: entry.title })}
					disabled={resumeMutation.isPending}
					onClick={() => resumeMutation.mutate(entry.id)}
					size={size}
					variant="outline"
				>
					<PlayIcon aria-hidden="true" />
				</Button>
			)}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						aria-label={m.actionsOpenMenu()}
						size={size}
						variant="ghost"
					>
						<EllipsisHorizontalIcon aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => setEditing(true)}>
						<PencilSquareIcon aria-hidden="true" />
						{m.actionsEdit()}
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => setDeleting(true)} variant="destructive">
						<TrashIcon aria-hidden="true" />
						{m.actionsDelete()}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	)
}
