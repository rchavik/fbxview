# fbxview

A vibe-coded browser-only 3D character and animation preview tool built with React, TypeScript, Vite, and Three.js.

It supports uploading multiple character models and multiple animation files, then applying animations to the active character directly in the browser. No backend service is required.

Primarily used for browse/file mixamo model/animation files.

## Features

- Client-side model and animation processing
- Supported formats: `.fbx`, `.glb`, `.gltf`
- Upload multiple character files and switch the active character
- Upload multiple animation files and select animation clips
- Playback controls: play, pause, stop, restart, seek, speed
- Camera controls: rotate, pan, zoom
- Preview customization: background color picker and presets
- Rig compatibility normalization for common Mixamo naming variants
- Persistent viewer preferences in local storage

## Tech Stack

- React + TypeScript
- Vite
- Three.js
- Zustand

## Local Development

### Requirements

- Node.js 22+
- npm

### Install

```bash
npm ci
```

### Run Development Server

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### Preview Build Output

```bash
npm run preview
```

## Usage Notes

- Upload one or more character files, then pick an active character.
- Upload animation files; compatible clips become selectable.
- If an animation clip is rejected, it usually means the animation rig does not sufficiently overlap with the active character rig.

## Controls

- Left mouse: rotate camera
- Middle mouse: pan camera
- Mouse wheel / right mouse: zoom