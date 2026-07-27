import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import * as m from '@/paraglide/messages.js'
import { useLocale } from '@/shared/i18n'

import { useTheme } from '@/features/preferences/theme'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui'

export default function ThemeToggle() {
	'use no memo'

	useLocale()
	const { setTheme, theme } = useTheme()
	const nextTheme = theme === 'light' ? 'dark' : 'light'
	const label =
		nextTheme === 'dark'
			? m.preferencesThemeSwitchToDark()
			: m.preferencesThemeSwitchToLight()

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button aria-label={label} onClick={() => setTheme(nextTheme)} size="icon" variant="ghost">
					{theme === 'light' ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	)
}
