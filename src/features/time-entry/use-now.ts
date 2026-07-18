import { useEffect, useState } from 'react'

const CLOCK_INTERVAL_MS = 1_000
const CLOCK_ALIGNMENT_DELAY_MS = 0

export default function useNow(enabled = true): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!enabled) {
			return undefined
		}

		const alignmentTimeout = window.setTimeout(() => setNow(Date.now()), CLOCK_ALIGNMENT_DELAY_MS)
		const interval = window.setInterval(() => setNow(Date.now()), CLOCK_INTERVAL_MS)
		return () => {
			window.clearTimeout(alignmentTimeout)
			window.clearInterval(interval)
		}
	}, [enabled])

	return now
}
