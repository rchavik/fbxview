import { useEffect, useRef, useState } from 'react'
import {
  AmbientLight,
  AnimationAction,
  AnimationMixer,
  AxesHelper,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  GridHelper,
  HemisphereLight,
  MOUSE,
  Object3D,
  PerspectiveCamera,
  Scene,
  SkeletonHelper,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useViewerStore } from '../state/useViewerStore'
import { buildActionsFromClips, buildBoundClips, getRigBoneNames } from './animationBinding'
import { disposeObject3D, loadAssetFromFile } from './loaders'

type ViewerCanvasProps = {
  className?: string
}

export function ViewerCanvas({ className }: ViewerCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const cameraRef = useRef<PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  const modelRef = useRef<Object3D | null>(null)
  const skeletonHelperRef = useRef<SkeletonHelper | null>(null)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map())
  const currentActionRef = useRef<AnimationAction | null>(null)
  const cameraZoomRef = useRef(1)
  const speedRef = useRef(1)
  const showSkeletonRef = useRef(false)
  const [modelReadyNonce, setModelReadyNonce] = useState(0)

  const modelFile = useViewerStore((state) => state.modelFile)
  const animationFiles = useViewerStore((state) => state.animationFiles)
  const selectedClipId = useViewerStore((state) => state.selectedClipId)
  const playbackState = useViewerStore((state) => state.playbackState)
  const speed = useViewerStore((state) => state.speed)
  const cameraZoom = useViewerStore((state) => state.cameraZoom)
  const previewBgColor = useViewerStore((state) => state.previewBgColor)
  const restartNonce = useViewerStore((state) => state.restartNonce)
  const seekRequest = useViewerStore((state) => state.seekRequest)
  const showSkeleton = useViewerStore((state) => state.showSkeleton)

  const setBusy = useViewerStore((state) => state.setBusy)
  const setClips = useViewerStore((state) => state.setClips)
  const setSeekRequest = useViewerStore((state) => state.setSeekRequest)
  const setPlaybackMetrics = useViewerStore((state) => state.setPlaybackMetrics)
  const setPlaybackState = useViewerStore((state) => state.setPlaybackState)
  const pushError = useViewerStore((state) => state.pushError)

  useEffect(() => {
    cameraZoomRef.current = cameraZoom
  }, [cameraZoom])

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    showSkeletonRef.current = showSkeleton
  }, [showSkeleton])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, 16 / 9, 0.1, 300)
    const renderer = new WebGLRenderer({ antialias: true, alpha: false })
    const clock = new Clock()
    const controls = new OrbitControls(camera, renderer.domElement)

    sceneRef.current = scene
    cameraRef.current = camera
    controlsRef.current = controls
    scene.background = new Color('#ffffff')
    camera.position.set(0, 1.55, 3.8)

    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.enableRotate = true
    controls.enableZoom = true
    controls.mouseButtons.LEFT = MOUSE.ROTATE
    controls.mouseButtons.MIDDLE = MOUSE.PAN
    controls.mouseButtons.RIGHT = MOUSE.DOLLY

    const ambient = new AmbientLight('#ecf3ff', 1.45)
    const hemi = new HemisphereLight('#e9f5ff', '#3f4f63', 0.95)
    const key = new DirectionalLight('#ffffff', 2.25)
    key.position.set(6, 8, 5)
    const fill = new DirectionalLight('#9ed1ff', 1.35)
    fill.position.set(-5, 5, -4)
    const rim = new DirectionalLight('#ffe6c4', 0.9)
    rim.position.set(0, 4, -6)

    const grid = new GridHelper(14, 20, '#2d465f', '#1a2a3a')
    grid.position.y = -1
    const axes = new AxesHelper(2.2)
    axes.position.y = -1

    scene.add(ambient, hemi, key, fill, rim, grid, axes)

    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMappingExposure = 1.35
    container.appendChild(renderer.domElement)

    const resize = () => {
      const width = container.clientWidth || 1
      const height = container.clientHeight || 1
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    resize()
    window.addEventListener('resize', resize)

    let rafId = 0
    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop)

      const delta = clock.getDelta()
      const mixer = mixerRef.current
      if (mixer) {
        mixer.update(delta)
        const action = currentActionRef.current
        if (action) {
          setPlaybackMetrics(action.time, action.getClip().duration)
        }
      }

      controls.update()

      renderer.render(scene, camera)
    }

    renderLoop()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }

      renderer.dispose()
      controls.dispose()
      scene.clear()
      sceneRef.current = null
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [setPlaybackMetrics])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) {
      return
    }

    scene.background = new Color(previewBgColor)
  }, [previewBgColor])

  useEffect(() => {
    const helper = skeletonHelperRef.current
    if (helper) {
      helper.visible = showSkeleton
    }
  }, [showSkeleton])

  useEffect(() => {
    const mixer = mixerRef.current
    if (mixer) {
      mixer.timeScale = speed
    }
  }, [speed])

  useEffect(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) {
      return
    }

    camera.zoom = cameraZoom
    camera.updateProjectionMatrix()
    controls.update()
  }, [cameraZoom])

  useEffect(() => {
    const mixer = mixerRef.current
    const action = currentActionRef.current
    if (!mixer || !action || seekRequest === null) {
      return
    }

    const safeTime = Math.max(0, Math.min(action.getClip().duration, seekRequest))
    action.time = safeTime
    mixer.update(0)
    setPlaybackMetrics(safeTime, action.getClip().duration)
    setSeekRequest(null)
  }, [seekRequest, setPlaybackMetrics, setSeekRequest])

  useEffect(() => {
    const action = currentActionRef.current
    if (!action) {
      return
    }

    if (playbackState === 'playing') {
      action.paused = false
      action.enabled = true
      action.play()
    } else if (playbackState === 'paused') {
      action.paused = true
    } else {
      action.stop()
      action.reset()
      action.paused = false
      setPlaybackMetrics(0, action.getClip().duration)
    }
  }, [playbackState, setPlaybackMetrics])

  useEffect(() => {
    const action = currentActionRef.current
    if (!action) {
      return
    }

    action.stop()
    action.reset()
    action.play()
    action.paused = false
    setPlaybackState('playing')
    setPlaybackMetrics(0, action.getClip().duration)
  }, [restartNonce, setPlaybackMetrics, setPlaybackState])

  useEffect(() => {
    const nextAction = selectedClipId ? actionsRef.current.get(selectedClipId) : null
    const currentAction = currentActionRef.current

    if (!nextAction) {
      if (currentAction) {
        currentAction.stop()
        currentActionRef.current = null
      }
      return
    }

    if (currentAction === nextAction) {
      return
    }

    if (currentAction) {
      currentAction.fadeOut(0.1)
    }

    nextAction.reset().fadeIn(0.12).play()
    nextAction.paused = playbackState !== 'playing'
    currentActionRef.current = nextAction
    setPlaybackMetrics(nextAction.time, nextAction.getClip().duration)
  }, [selectedClipId, playbackState, setPlaybackMetrics])

  useEffect(() => {
    let cancelled = false

    const disposeModel = () => {
      const scene = sceneRef.current

      if (modelRef.current) {
        if (scene) {
          scene.remove(modelRef.current)
        }
        disposeObject3D(modelRef.current)
        modelRef.current = null
      }

      if (skeletonHelperRef.current) {
        if (scene) {
          scene.remove(skeletonHelperRef.current)
        }
        skeletonHelperRef.current = null
      }

      actionsRef.current.clear()
      currentActionRef.current = null
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      setClips([])
      setPlaybackMetrics(0, 0)
      setPlaybackState('stopped')
    }

    const loadModel = async () => {
      disposeModel()
      if (!modelFile) {
        return
      }

      const scene = sceneRef.current
      if (!scene) {
        return
      }

      setBusy(true, `Loading model: ${modelFile.name}...`)

      try {
        const loaded = await loadAssetFromFile(modelFile)
        if (cancelled) {
          disposeObject3D(loaded.root)
          return
        }

        modelRef.current = loaded.root
        scene.add(loaded.root)

        const bounds = new Box3().setFromObject(loaded.root)
        const sphere = new Sphere()
        bounds.getBoundingSphere(sphere)
        if (Number.isFinite(sphere.radius) && sphere.radius > 0) {
          const activeCamera = cameraRef.current
          const controls = controlsRef.current
          if (activeCamera) {
            const fitOffset = 1.25
            const verticalFov = (activeCamera.fov * Math.PI) / 180
            const fitHeightDistance = sphere.radius / Math.tan(verticalFov / 2)
            const fitWidthDistance = fitHeightDistance / activeCamera.aspect
            const distance = Math.max(fitHeightDistance, fitWidthDistance) * fitOffset
            const direction = new Vector3(0.2, 0.4, 1).normalize()

            activeCamera.near = Math.max(0.01, distance / 100)
            activeCamera.far = Math.max(100, distance * 100)
            activeCamera.position.copy(sphere.center).addScaledVector(direction, distance)
            activeCamera.lookAt(sphere.center)
            activeCamera.updateProjectionMatrix()

            if (controls) {
              controls.target.copy(sphere.center)
              controls.update()
            }
          }
        }

        const helper = new SkeletonHelper(loaded.root)
        helper.visible = showSkeletonRef.current
        skeletonHelperRef.current = helper
        scene.add(helper)

        const mixer = new AnimationMixer(loaded.root)
        mixer.timeScale = speedRef.current
        mixerRef.current = mixer
        setModelReadyNonce((value) => value + 1)

        setBusy(false, `Model loaded: ${modelFile.name}.`)
      } catch (error) {
        const message =
          error instanceof Error
            ? `Failed to load model ${modelFile.name}: ${error.message}`
            : `Failed to load model ${modelFile.name}.`
        pushError(message)
        setBusy(false)
      }
    }

    void loadModel()

    return () => {
      cancelled = true
    }
  }, [
    modelFile,
    pushError,
    setBusy,
    setClips,
    setPlaybackMetrics,
    setPlaybackState,
  ])

  useEffect(() => {
    let cancelled = false

    const loadAnimations = async () => {
      const model = modelRef.current
      const mixer = mixerRef.current
      if (!model || !mixer) {
        setClips([])
        return
      }

      if (animationFiles.length === 0) {
        actionsRef.current.clear()
        currentActionRef.current = null
        setClips([])
        setPlaybackMetrics(0, 0)
        setPlaybackState('stopped')
        return
      }

      setBusy(true, 'Loading animation files...')

      try {
        const rigBoneNames = getRigBoneNames(model)
        const bound: ReturnType<typeof buildBoundClips> = []

        for (const file of animationFiles) {
          const loaded = await loadAssetFromFile(file)
          if (cancelled) {
            break
          }

          const clips = buildBoundClips(loaded, rigBoneNames, file.name)
          if (clips.length === 0) {
            pushError(`No compatible clips found in ${file.name}. Ensure it matches the model rig.`)
          }
          bound.push(...clips)
        }

        if (cancelled) {
          return
        }

        actionsRef.current.forEach((action) => action.stop())
        actionsRef.current = buildActionsFromClips(mixer, bound)

        const summaries = bound.map((entry) => entry.summary)
        setClips(summaries)

        if (summaries.length > 0) {
          setPlaybackState('playing')
          const first = actionsRef.current.get(summaries[0].id)
          if (first) {
            first.reset().play()
            first.paused = false
            currentActionRef.current = first
            setPlaybackMetrics(0, first.getClip().duration)
          }
        } else {
          currentActionRef.current = null
          setPlaybackState('stopped')
          setPlaybackMetrics(0, 0)
        }

        setBusy(false, 'Animation files processed.')
      } catch (error) {
        const message =
          error instanceof Error
            ? `Failed to load animation files: ${error.message}`
            : 'Failed to load animation files.'
        pushError(message)
        setBusy(false)
      }
    }

    void loadAnimations()

    return () => {
      cancelled = true
    }
  }, [
    animationFiles,
    modelReadyNonce,
    pushError,
    setBusy,
    setClips,
    setPlaybackMetrics,
    setPlaybackState,
  ])

  return <div ref={containerRef} className={className} />
}
