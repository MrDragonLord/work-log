import { BuildingOffice2Icon, Squares2X2Icon } from '@heroicons/react/24/outline'
import * as m from '@/paraglide/messages.js'
import { useLocale } from '@/shared/i18n'

import { WorklogIcon } from '@/shared/assets'
import { cn } from '@/shared/lib'

export type AppSection = 'overview' | 'workspaces'

const NAVIGATION_ITEM_CLASS =
	'group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

type AppNavigationProps = {
	activeSection: AppSection
	onNavigate: (section: AppSection) => void
}

export function Brand() {
	'use no memo'

	useLocale()

	return (
		<div className="flex min-w-0 items-center gap-3">
			<img
				alt=""
				aria-hidden="true"
				className="size-10 shrink-0"
				height={40}
				src={WorklogIcon}
				width={40}
			/>
			<div className="min-w-0">
				<p className="truncate font-heading text-base font-semibold tracking-[-0.02em]">
					{m.appName()}
				</p>
				<p className="truncate text-xs text-muted-foreground">
					{m.appTagline()}
				</p>
			</div>
		</div>
	)
}

export default function AppNavigation({ activeSection, onNavigate }: AppNavigationProps) {
	'use no memo'

	useLocale()
	const navigationItems = [
		{
			icon: Squares2X2Icon,
			id: 'overview' as const,
			label: m.navigationOverview(),
		},
		{
			icon: BuildingOffice2Icon,
			id: 'workspaces' as const,
			label: m.navigationWorkspaces(),
		},
	]

	return (
		<nav aria-label={m.navigationLabel()} className="flex flex-col gap-1">
			{navigationItems.map(({ icon: Icon, id, label }) => {
				const isActive = activeSection === id

				return (
					<button
						aria-current={isActive ? 'page' : undefined}
						className={cn(
							NAVIGATION_ITEM_CLASS,
							isActive
								? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
								: 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
						)}
						key={id}
						onClick={() => onNavigate(id)}
						type="button"
					>
						<Icon aria-hidden="true" className="size-4.5" />
						<span>{label}</span>
					</button>
				)
			})}
		</nav>
	)
}
