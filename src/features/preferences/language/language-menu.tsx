import { CheckIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { setTrayLocale } from '@/shared/api'
import { type Locale, changeLocale, normalizeLocale } from '@/shared/i18n'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/ui'

const LOCALE_OPTIONS: ReadonlyArray<{ labelKey: string; locale: Locale }> = [
	{ labelKey: 'preferences.language.english', locale: 'en' },
	{ labelKey: 'preferences.language.russian', locale: 'ru' },
]

export default function LanguageMenu() {
	const { i18n, t } = useTranslation()
	const activeLocale = normalizeLocale(i18n.resolvedLanguage) ?? 'en'

	useEffect(() => {
		setTrayLocale(activeLocale).catch((error: unknown) => {
			console.error('Failed to update tray locale', error)
		})
	}, [activeLocale])

	function handleLocaleChange(locale: Locale): void {
		changeLocale(locale).catch((error: unknown) => {
			console.error('Failed to change locale', error)
		})
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					aria-label={t('preferences.language.label')}
					className="gap-2 px-2.5 font-mono uppercase"
					variant="ghost"
				>
					<LanguageIcon aria-hidden="true" />
					<span>{activeLocale}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44">
				<DropdownMenuLabel>{t('preferences.language.label')}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{LOCALE_OPTIONS.map(({ labelKey, locale }) => (
					<DropdownMenuItem key={locale} onSelect={() => handleLocaleChange(locale)}>
						<CheckIcon
							aria-hidden="true"
							className={activeLocale === locale ? 'opacity-100' : 'opacity-0'}
						/>
						{t(labelKey)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
