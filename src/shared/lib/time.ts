const MILLISECONDS_PER_SECOND = 1_000
const SECONDS_PER_HOUR = 3_600
const SECONDS_PER_MINUTE = 60

export function formatDuration(
	elapsedMilliseconds: number,
	runningSince: string | null,
	now: number,
): string {
	return formatDurationMilliseconds(getDurationMilliseconds(elapsedMilliseconds, runningSince, now))
}

export function formatDurationMilliseconds(milliseconds: number): string {
	const totalSeconds = Math.max(0, Math.floor(milliseconds / MILLISECONDS_PER_SECOND))
	const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR)
	const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
	const seconds = totalSeconds % SECONDS_PER_MINUTE

	return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

export function getDurationMilliseconds(
	elapsedMilliseconds: number,
	runningSince: string | null,
	now: number,
): number {
	const storedDuration = Math.max(0, elapsedMilliseconds)
	if (runningSince === null) {
		return storedDuration
	}

	const runningDuration = Math.max(0, now - new Date(runningSince).getTime())
	return storedDuration + runningDuration
}

export function getLocalDayRange(date = new Date()): { end: string; start: string } {
	const start = new Date(date)
	start.setHours(0, 0, 0, 0)

	const end = new Date(start)

	end.setDate(end.getDate() + 1)

	return { end: end.toISOString(), start: start.toISOString() }
}

export function combineLocalDateAndTime(date: Date, time: string): Date | null {
	const [hours, minutes] = time.split(':').map(Number)
	if (
		!Number.isInteger(hours) ||
		!Number.isInteger(minutes) ||
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		return null
	}

	const result = new Date(date)
	result.setHours(hours, minutes, 0, 0)

	return result
}

export function toTimeInputValue(date = new Date()): string {
	return date.toTimeString().slice(0, 5)
}
