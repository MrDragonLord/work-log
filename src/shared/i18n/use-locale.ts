import { useSyncExternalStore } from 'react'

import { type Locale, getActiveLocale, subscribeToLocaleChanges } from './i18n'

export function useLocale(): Locale {
	return useSyncExternalStore(subscribeToLocaleChanges, getActiveLocale, getActiveLocale)
}
