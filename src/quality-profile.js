export function desktopQuality({ pixelRatio = 1 } = {}) {
  const nativeRatio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1
  // Use the same rendering quality on phones and computers, including 3x Retina screens.
  return Object.freeze({
    name: 'desktop', antialias: true, dpr: Math.max(1.25, Math.min(nativeRatio, 3)),
    shadowSize: 1536, reflectionSize: 384,
  })
}

export function deviceQuality() {
  return desktopQuality({ pixelRatio: window.devicePixelRatio })
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
