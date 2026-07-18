import { describe, expect, it } from 'vitest'

import {
	combineLocalDateAndTime,
	formatDuration,
	formatDurationMilliseconds,
	getDurationMilliseconds,
} from '@/shared/lib'

describe('time utilities', () => {
	it('formats elapsed time without drifting below zero', () => {
		expect(
			formatDuration(60_000, '2026-01-01T10:00:00.000Z', Date.parse('2026-01-01T11:02:03Z')),
		).toBe('01:03:03')
		expect(formatDurationMilliseconds(-1)).toBe('00:00:00')
	})

	it('uses only the stored elapsed duration for stopped entries', () => {
		expect(getDurationMilliseconds(1_800_000, null, Date.parse('2026-01-01T12:00:00Z'))).toBe(
			1_800_000,
		)
	})

	it('does not decrease stored duration while the clock catches up after resuming', () => {
		expect(
			getDurationMilliseconds(
				52_000,
				'2026-01-01T10:00:52.000Z',
				Date.parse('2026-01-01T10:00:50.000Z'),
			),
		).toBe(52_000)
	})

	it('combines a local calendar date with a valid time', () => {
		const combined = combineLocalDateAndTime(new Date(2026, 6, 18), '09:45')

		expect(combined?.getHours()).toBe(9)
		expect(combined?.getMinutes()).toBe(45)
		expect(combineLocalDateAndTime(new Date(), '25:00')).toBeNull()
	})
})
