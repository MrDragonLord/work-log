import { type ComponentProps } from 'react'

import { cn } from '@/shared/lib'

export default function Input({ className, type, ...props }: ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	)
}
