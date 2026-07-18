import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useTheme } from '@/features/preferences/theme'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui'

export default function ThemeToggle() {
	const { setTheme, theme } = useTheme()
	const { t } = useTranslation()
	const nextTheme = theme === 'light' ? 'dark' : 'light'
	const label =
		nextTheme === 'dark'
			? t('preferences.theme.switchToDark')
			: t('preferences.theme.switchToLight')

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
