import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Bone,
  Object3D,
  SkinnedMesh,
} from 'three'
import type { ClipSummary } from '../types'
import type { LoadedAsset } from './loaders'

export type BoundClip = {
  summary: ClipSummary
  clip: AnimationClip
}

/**
 * Extract the bone/object name from a Three.js AnimationClip track name.
 *
 * Handles the three common formats:
 *  - glTF:  "boneName.quaternion"            → "boneName"
 *  - FBX (slash):  "uuid/boneName.position"  → "boneName"
 *  - FBX (Mixamo pipe): "Armature|mixamorig:Hips.quaternion" → "mixamorig:Hips"
 */
const normalizeTrackTarget = (trackName: string): string => {
  // FBX pipe-path: take the segment after the last '|' (strips armature prefix)
  const pipeParts = trackName.split('|')
  const afterPipe = pipeParts[pipeParts.length - 1]

  // UUID slash-path: take the segment after the last '/'
  const slashParts = afterPipe.split('/')
  const afterSlash = slashParts[slashParts.length - 1]

  // Strip the property suffix (.quaternion, .position, .scale, …)
  return afterSlash.split('.')[0].trim()
}

const normalizeRigBoneName = (name: string): string => {
  const pipeParts = name.split('|')
  const afterPipe = pipeParts[pipeParts.length - 1]

  const slashParts = afterPipe.split('/')
  const afterSlash = slashParts[slashParts.length - 1]

  const core = afterSlash.split('.')[0].trim().toLowerCase()

  const mixamoMatch = core.match(/(?:^|:)mixamorig\d*:(.+)$/)
  if (mixamoMatch?.[1]) {
    return `mixamorig:${mixamoMatch[1]}`
  }

  const colonParts = core.split(':').filter(Boolean)
  return colonParts[colonParts.length - 1] ?? core
}

export const getRigBoneNames = (root: Object3D): Set<string> => {
  const names = new Set<string>()

  root.traverse((child) => {
    // Collect bones from every SkinnedMesh skeleton (handles multi-mesh rigs
    // where facial/hair meshes carry a subset of the armature bones).
    const skinned = child as SkinnedMesh
    if (skinned.isSkinnedMesh && skinned.skeleton) {
      for (const bone of skinned.skeleton.bones) {
        if (bone.name) {
          names.add(bone.name)
        }
      }
    }

    // Also collect bare Bone nodes not attached to any SkinnedMesh.
    if ((child as Bone).isBone && child.name) {
      names.add(child.name)
    }
  })

  return names
}

const isClipCompatibleWithRig = (clip: AnimationClip, rigBoneNames: Set<string>) => {
  if (rigBoneNames.size === 0) {
    return {
      ok: false,
      reason: 'Model has no detectable skeleton. Upload a rigged character model.',
    }
  }

  const normalizedRigBoneNames = new Set(
    [...rigBoneNames].map((name) => normalizeRigBoneName(name)),
  )

  const targets = clip.tracks
    .map((track) => normalizeTrackTarget(track.name))
    .filter(Boolean)
    .map((target) => normalizeRigBoneName(target))

  if (targets.length === 0) {
    return {
      ok: false,
      reason: `Clip "${clip.name || 'unnamed'}" has no valid animation targets.`,
    }
  }

  const uniqueTargets = [...new Set(targets)]
  const matchedTargets = uniqueTargets.filter((target) =>
    normalizedRigBoneNames.has(target),
  )

  const matchedCount = matchedTargets.length
  const matchedRatio = matchedCount / uniqueTargets.length

  // FBX clips can include helper/object tracks beyond bones. Treat clips as compatible
  // when there is meaningful overlap with the rig, even if many non-bone targets exist.
  const minAbsoluteMatches = Math.min(
    10,
    Math.max(2, Math.round(normalizedRigBoneNames.size * 0.04)),
  )

  if (matchedCount === 0) {
    return {
      ok: false,
      reason: `Clip "${clip.name || 'unnamed'}" does not match the model rig.`,
    }
  }

  if (matchedCount < minAbsoluteMatches && matchedRatio < 0.12) {
    return {
      ok: false,
      reason: `Clip "${clip.name || 'unnamed'}" does not match the model rig.`,
    }
  }

  return { ok: true as const }
}

export const buildBoundClips = (
  loaded: LoadedAsset,
  rigBoneNames: Set<string>,
  fileName: string,
): BoundClip[] => {
  const results: BoundClip[] = []

  loaded.animations.forEach((clip, index) => {
    const compatibility = isClipCompatibleWithRig(clip, rigBoneNames)
    if (!compatibility.ok) {
      return
    }

    const safeName = clip.name?.trim() || `${fileName}-clip-${index + 1}`
    const id = `${fileName}:${index}:${safeName}`

    results.push({
      summary: {
        id,
        name: safeName,
        duration: clip.duration,
        sourceFileName: fileName,
        format: loaded.format,
      },
      clip,
    })
  })

  return results
}

export const buildActionsFromClips = (
  mixer: AnimationMixer,
  boundClips: BoundClip[],
): Map<string, AnimationAction> => {
  const map = new Map<string, AnimationAction>()

  for (const bound of boundClips) {
    const action = mixer.clipAction(bound.clip)
    if (action) {
      map.set(bound.summary.id, action)
    }
  }

  return map
}
