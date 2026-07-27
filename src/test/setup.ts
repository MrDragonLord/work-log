import '@testing-library/jest-dom/vitest'

import { beforeEach } from 'vitest'

import { initializeLocale } from '@/shared/i18n'
import { writePreference } from '@/shared/lib'

beforeEach(() => {
	writePreference('locale', 'en')
	initializeLocale()
})
