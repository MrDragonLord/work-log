import { type ComponentProps } from 'react'

import { cn } from '@/shared/lib'

export default function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
	return (
		<textarea
			className={cn(
				'min-h-24 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			data-slot="textarea"
			{...props}
		/>
	)
}
