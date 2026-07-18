const PREFERENCE_PREFIX = 'worklog.preferences.v1'

function getPreferenceKey(name: string): string {
	return `${PREFERENCE_PREFIX}.${name}`
}

export function readPreference(name: string): string | null {
	try {
		return globalThis.localStorage.getItem(getPreferenceKey(name))
	} catch {
		return null
	}
}

export function writePreference(name: string, value: string): void {
	try {
		globalThis.localStorage.setItem(getPreferenceKey(name), value)
	} catch {
		// The application remains usable when storage is temporarily unavailable.
	}
}
