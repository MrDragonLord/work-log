import { Bars3Icon } from '@heroicons/react/24/outline'
import { type ReactNode, useState } from 'react'
import * as m from '@/paraglide/messages.js'
import { useLocale } from '@/shared/i18n'

import { LanguageMenu } from '@/features/preferences/language'
import { ThemeToggle } from '@/features/preferences/theme'
import { ActiveTimersDock } from '@/features/time-entry'
import { ExitConfirmationDialog } from '@/features/tray'
import {
	Button,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/shared/ui'

import AppNavigation, { type AppSection, Brand } from './app-navigation'

type AppShellProps = {
	activeSection: AppSection
	children: ReactNode
	locale: string
	onNavigate: (section: AppSection) => void
}

export default function AppShell({ activeSection, children, locale, onNavigate }: AppShellProps) {
	'use no memo'

	useLocale()
	const [isNavigationOpen, setNavigationOpen] = useState(false)

	function navigate(section: AppSection): void {
		onNavigate(section)
		setNavigationOpen(false)
	}

	return (
		<div className="min-h-svh bg-background text-foreground" data-locale={locale}>
			<aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-sidebar px-4 py-5 md:flex md:flex-col">
				<div className="px-1">
					<Brand />
				</div>
				<Separator className="my-5" />
				<AppNavigation activeSection={activeSection} onNavigate={onNavigate} />
			</aside>

			<div className="md:pl-64">
				<header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/88 px-4 backdrop-blur-xl sm:px-6">
					<Sheet onOpenChange={setNavigationOpen} open={isNavigationOpen}>
						<SheetTrigger asChild>
							<Button
								aria-label={m.commonOpenNavigation()}
								className="mr-2 md:hidden"
								size="icon"
								variant="ghost"
							>
								<Bars3Icon aria-hidden="true" />
							</Button>
						</SheetTrigger>
						<SheetContent
							className="w-[min(20rem,86vw)] bg-sidebar p-0"
							closeLabel={m.commonClose()}
							side="left"
						>
							<SheetHeader className="border-b px-5 py-5 pr-14 text-left">
								<SheetTitle asChild>
									<div>
										<Brand />
									</div>
								</SheetTitle>
								<SheetDescription className="sr-only">
									{m.navigationLabel()}
								</SheetDescription>
							</SheetHeader>
							<div className="p-4">
								<AppNavigation activeSection={activeSection} onNavigate={navigate} />
							</div>
						</SheetContent>
					</Sheet>

					<div className="ml-auto flex items-center gap-1">
						<LanguageMenu />
						<ThemeToggle />
					</div>
				</header>

				<main className="relative px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
					<div className="mx-auto max-w-7xl">{children}</div>
					<ActiveTimersDock />
				</main>
				<ExitConfirmationDialog />
			</div>
		</div>
	)
}
