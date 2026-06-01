import {
    AnimationClip,
    Object3D,
    type BufferGeometry,
    type Material,
    type Texture,
} from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { AssetFormat } from '../types'

export type LoadedAsset = {
  root: Object3D
  animations: AnimationClip[]
  format: AssetFormat
}

const gltfLoader = new GLTFLoader()
const fbxLoader = new FBXLoader()

const isSupportedExtension = (extension: string) =>
  extension === 'glb' || extension === 'gltf' || extension === 'fbx'

export const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

const loadGltf = async (url: string): Promise<LoadedAsset> => {
  const gltf = await gltfLoader.loadAsync(url)

  return {
    root: gltf.scene,
    animations: gltf.animations,
    format: 'gltf',
  }
}

const loadFbx = async (url: string): Promise<LoadedAsset> => {
  const root = await fbxLoader.loadAsync(url)

  return {
    root,
    animations: root.animations,
    format: 'fbx',
  }
}

export const loadAssetFromFile = async (file: File): Promise<LoadedAsset> => {
  const extension = getFileExtension(file.name)

  if (!isSupportedExtension(extension)) {
    throw new Error(
      `Unsupported extension "${extension || 'unknown'}" for file ${file.name}.`
    )
  }

  const url = URL.createObjectURL(file)

  try {
    if (extension === 'fbx') {
      return await loadFbx(url)
    }

    return await loadGltf(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const disposeObject3D = (root: Object3D) => {
  root.traverse((child) => {
    const maybeMesh = child as Object3D & {
      geometry?: BufferGeometry
      material?: Material | Material[]
    }

    maybeMesh.geometry?.dispose()

    const materials = Array.isArray(maybeMesh.material)
      ? maybeMesh.material
      : maybeMesh.material
        ? [maybeMesh.material]
        : []

    for (const material of materials) {
      for (const value of Object.values(material)) {
        const maybeTexture = value as Texture | undefined
        if (maybeTexture && typeof maybeTexture === 'object' && 'isTexture' in maybeTexture) {
          maybeTexture.dispose()
        }
      }

      material.dispose()
    }
  })
}
