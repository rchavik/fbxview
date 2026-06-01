export type AssetFormat = 'gltf' | 'fbx'

export type ClipSummary = {
  id: string
  name: string
  duration: number
  sourceFileName: string
  format: AssetFormat
}

export type PlaybackState = 'playing' | 'paused' | 'stopped'

export type ViewerError = {
  id: string
  message: string
}
