import { CheckIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

import * as m from '@/paraglide/messages.js'

import { setTrayLocale } from '@/shared/api'
import { type Locale, changeLocale, useLocale } from '@/shared/i18n'
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/ui'

export default function LanguageMenu() {
	'use no memo'

	const activeLocale = useLocale()
	const localeOptions: ReadonlyArray<{ label: string; locale: Locale }> = [
		{ label: m.preferencesLanguageEnglish(), locale: 'en' },
		{ label: m.preferencesLanguageRussian(), locale: 'ru' },
	]

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
					aria-label={m.preferencesLanguageLabel()}
					className="gap-2 px-2.5 font-mono uppercase"
					variant="ghost"
				>
					<LanguageIcon aria-hidden="true" />
					<span>{activeLocale}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44">
				<DropdownMenuLabel>
					{m.preferencesLanguageLabel()}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{localeOptions.map(({ label, locale }) => (
					<DropdownMenuItem key={locale} onSelect={() => handleLocaleChange(locale)}>
						<CheckIcon
							aria-hidden="true"
							className={activeLocale === locale ? 'opacity-100' : 'opacity-0'}
						/>
						{label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
