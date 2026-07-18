import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { type ChevronProps, DayPicker } from 'react-day-picker'

import { cn } from '@/shared/lib'

type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarChevron({ className, orientation }: ChevronProps) {
	const Icon = orientation === 'left' ? ChevronLeftIcon : ChevronRightIcon

	return <Icon aria-hidden="true" className={cn('size-4', className)} />
}

export default function Calendar({
	className,
	classNames,
	components,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			className={cn('p-3', className)}
			classNames={{
				button_next:
					'absolute top-0.5 right-0.5 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
				button_previous:
					'absolute top-0.5 left-0.5 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
				caption_label: 'text-sm font-medium',
				day: 'size-8 p-0 text-center text-sm',
				day_button:
					'grid size-8 place-items-center rounded-md font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
				disabled: 'text-muted-foreground opacity-35',
				hidden: 'invisible',
				month: 'relative space-y-3',
				month_caption: 'flex h-8 items-center justify-center',
				month_grid: 'w-full border-collapse',
				months: 'flex flex-col gap-4',
				outside: 'text-muted-foreground opacity-45',
				root: 'w-fit',
				selected:
					'[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
				today: '[&>button]:font-semibold',
				week: 'mt-1',
				weekday: 'size-8 text-center text-[0.7rem] font-medium text-muted-foreground',
				weekdays: 'border-b',
				weeks: 'relative',
				...classNames,
			}}
			components={{ Chevron: CalendarChevron, ...components }}
			showOutsideDays={showOutsideDays}
			{...props}
		/>
	)
}
