export function loadViewState(key, fallback = null) {
  if (typeof window === 'undefined') return fallback

  try {
    const sessionRaw = window.sessionStorage.getItem(key)
    if (sessionRaw) return JSON.parse(sessionRaw)
  } catch {}

  try {
    const localRaw = window.localStorage.getItem(key)
    return localRaw ? JSON.parse(localRaw) : fallback
  } catch {
    return fallback
  }
}

export function persistViewState(key, value) {
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(value)

  try {
    window.sessionStorage.setItem(key, serialized)
  } catch {}

  try {
    window.localStorage.setItem(key, serialized)
  } catch {}
}

export function clearViewState(key) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(key)
  } catch {}

  try {
    window.localStorage.removeItem(key)
  } catch {}
}
