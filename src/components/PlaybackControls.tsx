import type { ClipSummary, PlaybackState } from '../types'

type PlaybackControlsProps = {
  clips: ClipSummary[]
  selectedClipId: string | null
  playbackState: PlaybackState
  speed: number
  cameraZoom: number
  previewBgColor: string
  currentTime: number
  duration: number
  showSkeleton: boolean
  isBusy: boolean
  onSelectClip: (id: string) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onRestart: () => void
  onSpeedChange: (speed: number) => void
  onCameraZoomChange: (zoom: number) => void
  onPreviewBgColorChange: (value: string) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSeek: (timeInSeconds: number) => void
  onToggleSkeleton: (value: boolean) => void
}

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  return safe.toFixed(2)
}

export function PlaybackControls({
  clips,
  selectedClipId,
  playbackState,
  speed,
  cameraZoom,
  previewBgColor,
  currentTime,
  duration,
  showSkeleton,
  isBusy,
  onSelectClip,
  onPlay,
  onPause,
  onStop,
  onRestart,
  onSpeedChange,
  onCameraZoomChange,
  onPreviewBgColorChange,
  onZoomIn,
  onZoomOut,
  onSeek,
  onToggleSkeleton,
}: PlaybackControlsProps) {
  const hasClip = clips.length > 0

  return (
    <section className="panel">
      <h2>Playback</h2>
      <p className="panel-copy">Choose a clip and control playback on the character.</p>

      <label className="field">
        <span>Animation clip</span>
        <select
          value={selectedClipId ?? ''}
          onChange={(event) => onSelectClip(event.target.value)}
          disabled={!hasClip || isBusy}
        >
          {!hasClip && <option value="">No clips loaded</option>}
          {clips.map((clip) => (
            <option key={clip.id} value={clip.id}>
              {clip.name} ({clip.sourceFileName})
            </option>
          ))}
        </select>
      </label>

      <div className="button-row">
        <button type="button" onClick={onPlay} disabled={!hasClip || isBusy}>
          Play
        </button>
        <button type="button" onClick={onPause} disabled={!hasClip || isBusy}>
          Pause
        </button>
        <button type="button" onClick={onStop} disabled={!hasClip || isBusy}>
          Stop
        </button>
        <button type="button" onClick={onRestart} disabled={!hasClip || isBusy}>
          Restart
        </button>
      </div>

      <label className="field">
        <span>Speed: {speed.toFixed(2)}x</span>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          disabled={isBusy}
        />
      </label>

      <label className="field">
        <span>Camera zoom: {cameraZoom.toFixed(2)}x</span>
        <input
          type="range"
          min={0.45}
          max={2.5}
          step={0.05}
          value={cameraZoom}
          onChange={(event) => onCameraZoomChange(Number(event.target.value))}
          disabled={isBusy}
        />
      </label>

      <div className="button-row">
        <button type="button" onClick={onZoomOut} disabled={isBusy}>
          Zoom out
        </button>
        <button type="button" onClick={onZoomIn} disabled={isBusy}>
          Zoom in
        </button>
      </div>

      <label className="field">
        <span>Preview background</span>
        <input
          type="color"
          value={previewBgColor}
          onChange={(event) => onPreviewBgColorChange(event.target.value)}
          disabled={isBusy}
        />
      </label>

      <div className="button-row">
        <button type="button" onClick={() => onPreviewBgColorChange('#ffffff')} disabled={isBusy}>
          White
        </button>
        <button type="button" onClick={() => onPreviewBgColorChange('#e9eef5')} disabled={isBusy}>
          Studio gray
        </button>
      </div>

      <div className="button-row">
        <button type="button" onClick={() => onPreviewBgColorChange('#dff1ff')} disabled={isBusy}>
          Sky
        </button>
        <button type="button" onClick={() => onPreviewBgColorChange('#111827')} disabled={isBusy}>
          Dark slate
        </button>
      </div>

      <label className="field">
        <span>
          Timeline: {formatTime(currentTime)} / {formatTime(duration)} sec
        </span>
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 1}
          step={0.01}
          value={Math.min(currentTime, duration > 0 ? duration : 1)}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={!hasClip || isBusy || duration <= 0}
        />
      </label>

      <label className="field checkbox-row">
        <input
          type="checkbox"
          checked={showSkeleton}
          onChange={(event) => onToggleSkeleton(event.target.checked)}
        />
        <span>Show skeleton helper</span>
      </label>

      <p className="playback-tag">
        State: <strong>{playbackState}</strong>
      </p>
    </section>
  )
}
