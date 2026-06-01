const SESSION_KEY = 'fbxview-session-v1'

export type PersistedSession = {
  speed: number
  showSkeleton: boolean
  cameraZoom: number
  previewBgColor: string
}

export const readSession = (): PersistedSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSession>
    if (typeof parsed.speed !== 'number' || typeof parsed.showSkeleton !== 'boolean') {
      return null
    }

    const safeCameraZoom =
      typeof parsed.cameraZoom === 'number'
        ? Math.min(2.5, Math.max(0.45, parsed.cameraZoom))
        : 1

    const safePreviewBgColor =
      typeof parsed.previewBgColor === 'string' && parsed.previewBgColor.trim().length > 0
        ? parsed.previewBgColor
        : '#ffffff'

    return {
      speed: Math.min(2, Math.max(0.1, parsed.speed)),
      showSkeleton: parsed.showSkeleton,
      cameraZoom: safeCameraZoom,
      previewBgColor: safePreviewBgColor,
    }
  } catch {
    return null
  }
}

export const writeSession = (session: PersistedSession) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Persistence can fail in private mode; ignore to keep the app functional.
  }
}
