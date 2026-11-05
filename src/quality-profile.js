export function balancedQuality({ memory = 8, cores = 8, touch = false, pixelRatio = 1 } = {}) {
  const limited = memory <= 4 || cores <= 4
  const compact = limited || touch
  const nativeRatio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1
  // Retina phones need more than one drawing-buffer pixel per CSS pixel at rest.
  const idleDpr = touch ? Math.max(1, Math.min(nativeRatio, limited ? 1.5 : 2)) : limited ? 1 : 1.25
  return Object.freeze({
    name: 'balanced', antialias: !limited, idleDpr, motionDpr: limited ? .75 : touch ? 1 : .85,
    minDpr: .65, shadowSize: limited ? 768 : touch ? 1024 : 1536,
    reflectionSize: compact ? 256 : 384, restoreDelay: 450,
  })
}

export function deviceQuality() {
  return balancedQuality({ memory: navigator.deviceMemory || 8, cores: navigator.hardwareConcurrency || 8,
    touch: window.matchMedia('(pointer: coarse)').matches, pixelRatio: window.devicePixelRatio })
}

// Keep neighbouring rooms visible through openings, but skip rooms behind solid walls.
export function visibleRoomIds(x, z, directionZ, directionX) {
  if (z > 1.82 || x > 3.15 || x < -3.94) return ['living-left', 'living-right']
  if (z < -5.90) return directionZ > .2 ? ['bathroom', 'kitchen-right', 'living-right'] : ['bathroom', 'kitchen-right']
  if (z < -2.0 && x < -.50) return ['bedroom-left', 'kitchen-right', ...(directionZ > .2 ? ['living-right'] : [])]
  if (z < -2.0) return ['kitchen-right', 'bathroom', ...(directionZ > .05 ? ['living-left', 'living-right'] : []),
    ...(directionX < -.25 || x < .50 ? ['bedroom-left'] : [])]
  return ['living-left', 'living-right', 'kitchen-right']
}

export function initialRoomIds(id) {
  if (id === 'bathroom') return ['bathroom', 'kitchen-right']
  if (id === 'kitchen-right') return ['kitchen-right', 'bathroom', 'living-right']
  if (id === 'bedroom-left') return ['bedroom-left', 'kitchen-right']
  if (id === 'living-right') return ['living-right', 'living-left', 'kitchen-right']
  return ['living-left', 'living-right', 'kitchen-right']
}
