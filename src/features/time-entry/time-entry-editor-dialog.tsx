import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { type TimeEntry, type UpdateTimeEntryInput } from '@/shared/api'
import { combineLocalDateAndTime, toTimeInputValue } from '@/shared/lib'
import {
	Button,
	Calendar,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
} from '@/shared/ui'

type TimeEntryEditorDialogProps = {
	entry: TimeEntry
	isSaving: boolean
	onClose: () => void
	onSave: (input: UpdateTimeEntryInput) => void
}

export default function TimeEntryEditorDialog({
	entry,
	isSaving,
	onClose,
	onSave,
}: TimeEntryEditorDialogProps) {
	const { i18n, t } = useTranslation()
	const [isCalendarOpen, setCalendarOpen] = useState(false)
	const [isTimeInvalid, setTimeInvalid] = useState(false)
	const [description, setDescription] = useState(entry.description ?? '')
	const [startDate, setStartDate] = useState(() => new Date(entry.startedAt))
	const [startTime, setStartTime] = useState(() => toTimeInputValue(new Date(entry.startedAt)))
	const [title, setTitle] = useState(entry.title)
	const currentDate = new Date()
	const calendarLocale = (i18n.resolvedLanguage ?? i18n.language).startsWith('ru') ? ru : enUS
	const isToday = startDate.toDateString() === currentDate.toDateString()

	function handleSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault()
		const startedAt = combineLocalDateAndTime(startDate, startTime)
		if (startedAt === null || startedAt.getTime() > Date.now()) {
			setTimeInvalid(true)
			return
		}

		onSave({
			description,
			startedAt: startedAt.toISOString(),
			title,
		})
	}

	return (
		<Dialog onOpenChange={(isOpen) => !isOpen && onClose()} open>
			<DialogContent closeLabel={t('common.close')}>
				<DialogHeader>
					<DialogTitle>{t('actions.editTimeEntry')}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<label className="block text-sm font-medium" htmlFor="edit-timer-title">
						{t('timerForm.name')}
					</label>
					<Input
						className="mt-2"
						id="edit-timer-title"
						maxLength={200}
						onChange={(event) => setTitle(event.target.value)}
						required
						value={title}
					/>
					<label className="mt-4 block text-sm font-medium" htmlFor="edit-timer-description">
						{t('timerForm.description')}
					</label>
					<Textarea
						className="mt-2"
						id="edit-timer-description"
						maxLength={1000}
						onChange={(event) => setDescription(event.target.value)}
						value={description}
					/>
					<div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
						<div>
							<p className="text-sm font-medium">{t('timerForm.date')}</p>
							<Popover onOpenChange={setCalendarOpen} open={isCalendarOpen}>
								<PopoverTrigger asChild>
									<Button
										aria-invalid={isTimeInvalid || undefined}
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
												setStartDate(date)
												setTimeInvalid(false)
											}
										}}
										selected={startDate}
										timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div>
							<label className="block text-sm font-medium" htmlFor="edit-timer-start-time">
								{t('timerForm.time')}
							</label>
							<Input
								aria-invalid={isTimeInvalid || undefined}
								className="mt-2"
								id="edit-timer-start-time"
								max={isToday ? toTimeInputValue(currentDate) : undefined}
								onChange={(event) => {
									setStartTime(event.target.value)
									setTimeInvalid(false)
								}}
								required
								type="time"
								value={startTime}
							/>
						</div>
					</div>
					{isTimeInvalid ? (
						<p className="mt-3 text-sm text-destructive" role="alert">
							{t('timerForm.invalidRange')}
						</p>
					) : null}
					<DialogFooter className="mt-5">
						<Button onClick={onClose} type="button" variant="outline">
							{t('actions.cancel')}
						</Button>
						<Button disabled={isSaving} type="submit">
							{isSaving ? t('common.saving') : t('actions.save')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
