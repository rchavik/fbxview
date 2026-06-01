import { create } from 'zustand'
import type { ClipSummary, PlaybackState, ViewerError } from '../types'

type ViewerStore = {
  characterFiles: File[]
  activeCharacterId: string | null
  modelFile: File | null
  animationFiles: File[]
  clips: ClipSummary[]
  selectedClipId: string | null
  playbackState: PlaybackState
  speed: number
  cameraZoom: number
  previewBgColor: string
  currentTime: number
  duration: number
  seekRequest: number | null
  restartNonce: number
  isBusy: boolean
  statusMessage: string
  errors: ViewerError[]
  showSkeleton: boolean
  setModelFile: (file: File | null) => void
  addCharacterFiles: (files: File[]) => void
  clearCharacterFiles: () => void
  setActiveCharacterId: (id: string | null) => void
  addAnimationFiles: (files: File[]) => void
  clearAnimationFiles: () => void
  setClips: (clips: ClipSummary[]) => void
  setSelectedClipId: (id: string | null) => void
  setPlaybackState: (state: PlaybackState) => void
  setSpeed: (speed: number) => void
  setCameraZoom: (zoom: number) => void
  setPreviewBgColor: (value: string) => void
  zoomIn: () => void
  zoomOut: () => void
  setPlaybackMetrics: (currentTime: number, duration: number) => void
  setSeekRequest: (timeInSeconds: number | null) => void
  requestRestart: () => void
  setBusy: (value: boolean, statusMessage?: string) => void
  pushError: (message: string) => void
  clearErrors: () => void
  clearError: (id: string) => void
  setShowSkeleton: (value: boolean) => void
  resetSessionData: () => void
}

const makeErrorId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const dedupeFiles = (previous: File[], incoming: File[]) => {
  const byKey = new Map<string, File>()

  for (const file of previous) {
    byKey.set(`${file.name}:${file.size}:${file.lastModified}`, file)
  }

  for (const file of incoming) {
    byKey.set(`${file.name}:${file.size}:${file.lastModified}`, file)
  }

  return [...byKey.values()]
}

const fileId = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

const getFileById = (files: File[], id: string | null) => {
  if (!id) {
    return null
  }

  return files.find((file) => fileId(file) === id) ?? null
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  characterFiles: [],
  activeCharacterId: null,
  modelFile: null,
  animationFiles: [],
  clips: [],
  selectedClipId: null,
  playbackState: 'stopped',
  speed: 1,
  cameraZoom: 1,
  previewBgColor: '#696969',
  currentTime: 0,
  duration: 0,
  seekRequest: null,
  restartNonce: 0,
  isBusy: false,
  statusMessage: 'Upload a rigged model to begin.',
  errors: [],
  showSkeleton: false,
  setModelFile: (file) =>
    set({
      characterFiles: file ? [file] : [],
      activeCharacterId: file ? fileId(file) : null,
      modelFile: file,
      animationFiles: [...get().animationFiles],
      playbackState: 'stopped',
      currentTime: 0,
      duration: 0,
      selectedClipId: null,
      clips: [],
      statusMessage: file
        ? `Model selected: ${file.name}.`
        : 'Model cleared. Upload a rigged model to begin.',
    }),
  addCharacterFiles: (files) =>
    set((state) => {
      const characterFiles = dedupeFiles(state.characterFiles, files)
      const activeCharacterId =
        state.activeCharacterId ?? (characterFiles[0] ? fileId(characterFiles[0]) : null)
      const modelFile = getFileById(characterFiles, activeCharacterId)

      return {
        characterFiles,
        activeCharacterId,
        modelFile,
        animationFiles: [...state.animationFiles],
        playbackState: 'stopped' as const,
        selectedClipId: null,
        clips: [],
        currentTime: 0,
        duration: 0,
        statusMessage:
          files.length > 0
            ? `Added ${files.length} character file${files.length > 1 ? 's' : ''}.`
            : state.statusMessage,
      }
    }),
  clearCharacterFiles: () =>
    set({
      characterFiles: [],
      activeCharacterId: null,
      modelFile: null,
      selectedClipId: null,
      clips: [],
      playbackState: 'stopped',
      currentTime: 0,
      duration: 0,
      statusMessage: 'Character files cleared.',
    }),
  setActiveCharacterId: (id) =>
    set((state) => {
      const modelFile = getFileById(state.characterFiles, id)

      return {
        activeCharacterId: id,
        modelFile,
        animationFiles: [...state.animationFiles],
        selectedClipId: null,
        clips: [],
        playbackState: 'stopped' as const,
        currentTime: 0,
        duration: 0,
        statusMessage: modelFile
          ? `Active character: ${modelFile.name}.`
          : 'No active character selected.',
      }
    }),
  addAnimationFiles: (files) =>
    set((state) => ({
      animationFiles: dedupeFiles(state.animationFiles, files),
      statusMessage:
        files.length > 0
          ? `Added ${files.length} animation file${files.length > 1 ? 's' : ''}.`
          : state.statusMessage,
    })),
  clearAnimationFiles: () =>
    set({
      animationFiles: [],
      clips: [],
      selectedClipId: null,
      playbackState: 'stopped',
      currentTime: 0,
      duration: 0,
      statusMessage: 'Animation files cleared.',
    }),
  setClips: (clips) =>
    set((state) => {
      const hasSelectedClip =
        state.selectedClipId !== null &&
        clips.some((clip) => clip.id === state.selectedClipId)

      return {
        clips,
        selectedClipId: hasSelectedClip
          ? state.selectedClipId
          : clips[0]?.id ?? null,
        statusMessage:
          clips.length > 0
            ? `Loaded ${clips.length} animation clip${clips.length > 1 ? 's' : ''}.`
            : 'No compatible animation clips loaded yet.',
      }
    }),
  setSelectedClipId: (id) => set({ selectedClipId: id, currentTime: 0 }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setSpeed: (speed) => set({ speed }),
  setCameraZoom: (cameraZoom) =>
    set({ cameraZoom: Math.min(2.5, Math.max(0.45, cameraZoom)) }),
  setPreviewBgColor: (previewBgColor) => set({ previewBgColor }),
  zoomIn: () =>
    set((state) => ({ cameraZoom: Math.min(2.5, state.cameraZoom + 0.15) })),
  zoomOut: () =>
    set((state) => ({ cameraZoom: Math.max(0.45, state.cameraZoom - 0.15) })),
  setPlaybackMetrics: (currentTime, duration) => set({ currentTime, duration }),
  setSeekRequest: (timeInSeconds) => set({ seekRequest: timeInSeconds }),
  requestRestart: () =>
    set((state) => ({
      restartNonce: state.restartNonce + 1,
      playbackState: 'playing',
      currentTime: 0,
    })),
  setBusy: (value, statusMessage) =>
    set((state) => ({
      isBusy: value,
      statusMessage: statusMessage ?? state.statusMessage,
    })),
  pushError: (message) =>
    set((state) => ({
      errors: [...state.errors, { id: makeErrorId(), message }],
      statusMessage: message,
    })),
  clearErrors: () => set({ errors: [] }),
  clearError: (id) =>
    set((state) => ({ errors: state.errors.filter((error) => error.id !== id) })),
  setShowSkeleton: (value) => set({ showSkeleton: value }),
  resetSessionData: () => {
    const speed = get().speed
    const showSkeleton = get().showSkeleton

    set({
      modelFile: null,
      characterFiles: [],
      activeCharacterId: null,
      animationFiles: [],
      clips: [],
      selectedClipId: null,
      playbackState: 'stopped',
      currentTime: 0,
      duration: 0,
      seekRequest: null,
      restartNonce: 0,
      isBusy: false,
      statusMessage: 'Session reset.',
      errors: [],
      speed,
      cameraZoom: get().cameraZoom,
      previewBgColor: get().previewBgColor,
      showSkeleton,
    })
  },
}))
