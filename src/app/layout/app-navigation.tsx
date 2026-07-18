import { BuildingOffice2Icon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { WorklogIcon } from '@/shared/assets'
import { cn } from '@/shared/lib'

export type AppSection = 'overview' | 'workspaces'

const NAVIGATION_ITEMS = [
	{ icon: Squares2X2Icon, id: 'overview', labelKey: 'navigation.overview' },
	{ icon: BuildingOffice2Icon, id: 'workspaces', labelKey: 'navigation.workspaces' },
] as const

const NAVIGATION_ITEM_CLASS =
	'group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

type AppNavigationProps = {
	activeSection: AppSection
	onNavigate: (section: AppSection) => void
}

export function Brand() {
	const { t } = useTranslation()

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
					{t('app.name')}
				</p>
				<p className="truncate text-xs text-muted-foreground">{t('app.tagline')}</p>
			</div>
		</div>
	)
}

export default function AppNavigation({ activeSection, onNavigate }: AppNavigationProps) {
	const { t } = useTranslation()

	return (
		<nav aria-label={t('navigation.label')} className="flex flex-col gap-1">
			{NAVIGATION_ITEMS.map(({ icon: Icon, id, labelKey }) => {
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
						<span>{t(labelKey)}</span>
					</button>
				)
			})}
		</nav>
	)
}
