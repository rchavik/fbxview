import type { ChangeEvent } from 'react';

type UploadPanelProps = {
  characterOptions: Array<{ id: string; name: string }>
  activeCharacterId: string | null
  animationFileNames: string[]
  isBusy: boolean
  onCharactersSelected: (files: File[]) => void
  onActiveCharacterSelected: (id: string | null) => void
  onClearCharacters: () => void
  onAnimationsSelected: (files: File[]) => void
  onClearAnimations: () => void
  onResetSession: () => void
}

const modelAccept = '.glb,.gltf,.fbx'
const animationAccept = '.glb,.gltf,.fbx'

export function UploadPanel({
  characterOptions,
  activeCharacterId,
  animationFileNames,
  isBusy,
  onCharactersSelected,
  onActiveCharacterSelected,
  onClearCharacters,
  onAnimationsSelected,
  onClearAnimations,
  onResetSession,
}: UploadPanelProps) {
  const handleCharacterFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      onCharactersSelected(files)
    }
    event.target.value = ''
  }

  const handleAnimationFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      onAnimationsSelected(files)
    }
    event.target.value = ''
  }

  return (
    <section className="panel">
      <h2>Assets</h2>
      <p className="panel-copy">
        Upload multiple rigged character models and as many animation files as you need.
      </p>

      <label className="field">
        <span>Character model files</span>
        <input
          type="file"
          accept={modelAccept}
          multiple
          onChange={handleCharacterFiles}
          disabled={isBusy}
        />
      </label>

      <label className="field">
        <span>Active character</span>
        <select
          value={activeCharacterId ?? ''}
          onChange={(event) => onActiveCharacterSelected(event.target.value || null)}
          disabled={characterOptions.length === 0 || isBusy}
        >
          {characterOptions.length === 0 && <option value="">No character loaded</option>}
          {characterOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <div className="file-meta">
        {characterOptions.length > 0
          ? `Loaded ${characterOptions.length} character file${characterOptions.length > 1 ? 's' : ''}.`
          : 'No character uploaded yet.'}
      </div>

      <label className="field">
        <span>Animation files</span>
        <input
          type="file"
          accept={animationAccept}
          multiple
          onChange={handleAnimationFiles}
          disabled={isBusy}
        />
      </label>

      <div className="file-list">
        {animationFileNames.length === 0 && <p>No animation files added.</p>}
        {animationFileNames.map((name) => (
          <p key={name}>{name}</p>
        ))}
      </div>

      <div className="button-row">
        <button
          type="button"
          className="secondary"
          onClick={onClearCharacters}
          disabled={characterOptions.length === 0 || isBusy}
        >
          Clear characters
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onClearAnimations}
          disabled={animationFileNames.length === 0 || isBusy}
        >
          Clear animations
        </button>
      </div>

      <div className="button-row single-action-row">
        <button type="button" className="danger" onClick={onResetSession} disabled={isBusy}>
          Reset session
        </button>
      </div>
    </section>
  )
}
