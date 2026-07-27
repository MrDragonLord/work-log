import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'

import { ThemeProvider } from '@/features/preferences/theme'
import { TooltipProvider } from '@/shared/ui'

const QUERY_CLIENT = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 30_000,
		},
	},
})

export default function AppProviders({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={QUERY_CLIENT}>
			<ThemeProvider>
				<TooltipProvider>{children}</TooltipProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}
