import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { ThemeContext } from '@/features/preferences/theme/theme-context'
import {
	type Theme,
	applyTheme,
	persistTheme,
	resolveInitialTheme,
} from '@/features/preferences/theme/theme'

export default function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())

	useEffect(() => {
		applyTheme(theme)
		persistTheme(theme)
	}, [theme])

	const value = useMemo(() => ({ setTheme, theme }), [theme])

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
