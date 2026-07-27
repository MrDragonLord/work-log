import * as m from '@/paraglide/messages.js'
import { useLocale } from '@/shared/i18n'

import { type TimeEntry } from '@/shared/api'
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

type DeleteTimeEntryDialogProps = {
	entry: TimeEntry
	isDeleting: boolean
	onCancel: () => void
	onConfirm: () => void
}

export default function DeleteTimeEntryDialog({
	entry,
	isDeleting,
	onCancel,
	onConfirm,
}: DeleteTimeEntryDialogProps) {
	'use no memo'

	useLocale()
	return (
		<AlertDialog onOpenChange={(isOpen) => !isOpen && !isDeleting && onCancel()} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{m.actionsDeleteTimeEntry()}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{m.actionsDeleteTimeEntryDescription({ title: entry.title })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{m.actionsCancel()}</AlertDialogCancel>
					<AlertDialogAction disabled={isDeleting} onClick={onConfirm}>
						{isDeleting
							? m.commonSaving()
							: m.actionsDelete()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
