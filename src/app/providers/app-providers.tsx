import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { type ReactNode } from 'react'

import { ThemeProvider } from '@/features/preferences/theme'
import { I18N } from '@/shared/i18n'
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
		<I18nextProvider i18n={I18N}>
			<QueryClientProvider client={QUERY_CLIENT}>
				<ThemeProvider>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</I18nextProvider>
	)
}
