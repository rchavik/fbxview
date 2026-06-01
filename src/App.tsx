import { useEffect } from 'react'
import { PlaybackControls } from './components/PlaybackControls'
import { UploadPanel } from './components/UploadPanel'
import { readSession, writeSession } from './persistence/sessionStore'
import { useViewerStore } from './state/useViewerStore'
import { ViewerCanvas } from './viewer/ViewerCanvas'

function App() {
  const characterFiles = useViewerStore((state) => state.characterFiles)
  const activeCharacterId = useViewerStore((state) => state.activeCharacterId)
  const animationFiles = useViewerStore((state) => state.animationFiles)
  const clips = useViewerStore((state) => state.clips)
  const selectedClipId = useViewerStore((state) => state.selectedClipId)
  const playbackState = useViewerStore((state) => state.playbackState)
  const speed = useViewerStore((state) => state.speed)
  const cameraZoom = useViewerStore((state) => state.cameraZoom)
  const previewBgColor = useViewerStore((state) => state.previewBgColor)
  const currentTime = useViewerStore((state) => state.currentTime)
  const duration = useViewerStore((state) => state.duration)
  const isBusy = useViewerStore((state) => state.isBusy)
  const statusMessage = useViewerStore((state) => state.statusMessage)
  const errors = useViewerStore((state) => state.errors)
  const showSkeleton = useViewerStore((state) => state.showSkeleton)

  const addCharacterFiles = useViewerStore((state) => state.addCharacterFiles)
  const clearCharacterFiles = useViewerStore((state) => state.clearCharacterFiles)
  const setActiveCharacterId = useViewerStore((state) => state.setActiveCharacterId)
  const addAnimationFiles = useViewerStore((state) => state.addAnimationFiles)
  const clearAnimationFiles = useViewerStore((state) => state.clearAnimationFiles)
  const setSelectedClipId = useViewerStore((state) => state.setSelectedClipId)
  const setPlaybackState = useViewerStore((state) => state.setPlaybackState)
  const setSpeed = useViewerStore((state) => state.setSpeed)
  const setCameraZoom = useViewerStore((state) => state.setCameraZoom)
  const setPreviewBgColor = useViewerStore((state) => state.setPreviewBgColor)
  const zoomIn = useViewerStore((state) => state.zoomIn)
  const zoomOut = useViewerStore((state) => state.zoomOut)
  const setSeekRequest = useViewerStore((state) => state.setSeekRequest)
  const requestRestart = useViewerStore((state) => state.requestRestart)
  const setShowSkeleton = useViewerStore((state) => state.setShowSkeleton)
  const clearError = useViewerStore((state) => state.clearError)
  const clearErrors = useViewerStore((state) => state.clearErrors)
  const resetSessionData = useViewerStore((state) => state.resetSessionData)

  useEffect(() => {
    const persisted = readSession()
    if (!persisted) {
      return
    }

    setSpeed(persisted.speed)
    setCameraZoom(persisted.cameraZoom)
    setPreviewBgColor(persisted.previewBgColor)
    setShowSkeleton(persisted.showSkeleton)
  }, [setCameraZoom, setPreviewBgColor, setShowSkeleton, setSpeed])

  useEffect(() => {
    writeSession({ speed, showSkeleton, cameraZoom, previewBgColor })
  }, [cameraZoom, previewBgColor, showSkeleton, speed])

  return (
    <div className="app-shell">
      <header className="masthead">
        <p className="eyebrow">Client-Side 3D Animator</p>
        <h1>Character + Animation Preview Studio</h1>
        <p>
          Upload multiple character models and multiple animation files directly in your browser. No
          backend, no server state.
        </p>
      </header>

      <main className="workspace-layout">
        <aside className="left-column">
          <UploadPanel
            characterOptions={characterFiles.map((file) => ({
              id: `${file.name}:${file.size}:${file.lastModified}`,
              name: file.name,
            }))}
            activeCharacterId={activeCharacterId}
            animationFileNames={animationFiles.map((file) => file.name)}
            isBusy={isBusy}
            onCharactersSelected={addCharacterFiles}
            onActiveCharacterSelected={setActiveCharacterId}
            onClearCharacters={clearCharacterFiles}
            onAnimationsSelected={addAnimationFiles}
            onClearAnimations={clearAnimationFiles}
            onResetSession={resetSessionData}
          />

          <PlaybackControls
            clips={clips}
            selectedClipId={selectedClipId}
            playbackState={playbackState}
            speed={speed}
            cameraZoom={cameraZoom}
            previewBgColor={previewBgColor}
            currentTime={currentTime}
            duration={duration}
            showSkeleton={showSkeleton}
            isBusy={isBusy}
            onSelectClip={setSelectedClipId}
            onPlay={() => setPlaybackState('playing')}
            onPause={() => setPlaybackState('paused')}
            onStop={() => setPlaybackState('stopped')}
            onRestart={requestRestart}
            onSpeedChange={setSpeed}
            onCameraZoomChange={setCameraZoom}
            onPreviewBgColorChange={setPreviewBgColor}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onSeek={setSeekRequest}
            onToggleSkeleton={setShowSkeleton}
          />
        </aside>

        <section className="viewer-column">
          <div className="viewer-status">
            <p>{statusMessage}</p>
            {errors.length > 0 && (
              <div className="error-list">
                <div className="error-headline">
                  <strong>Warnings</strong>
                  <button type="button" className="linkish" onClick={clearErrors}>
                    Clear all
                  </button>
                </div>
                {errors.map((error) => (
                  <div key={error.id} className="error-item">
                    <p>{error.message}</p>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => clearError(error.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ViewerCanvas className="viewer-canvas" />
        </section>
      </main>
    </div>
  )
}

export default App
