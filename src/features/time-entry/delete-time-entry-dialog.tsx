import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation()

	return (
		<AlertDialog onOpenChange={(isOpen) => !isOpen && !isDeleting && onCancel()} open>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('actions.deleteTimeEntry')}</AlertDialogTitle>
					<AlertDialogDescription>
						{t('actions.deleteTimeEntryDescription', { title: entry.title })}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
					<AlertDialogAction disabled={isDeleting} onClick={onConfirm}>
						{isDeleting ? t('common.saving') : t('actions.delete')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
