import { useEffect } from 'react'
import { addAfterEffect, useThree } from '@react-three/fiber'

// Opt-in diagnostics for repeatable browser checks; absent from the normal UI.
export function PerformanceProbe() {
  const { gl, camera, invalidate } = useThree()
  useEffect(() => {
    const output = document.getElementById('performance-readout')
    if (!output) return
    const previousReset = gl.info.autoReset
    gl.info.autoReset = false
    let last = 0, wasMoving = false, total = 0, frames = 0, maximum = 0
    let readyMs = 0, movement = null, lastPublish = 0, previousDpr = 0
    const stop = addAfterEffect(() => {
      const now = performance.now()
      if (!readyMs && camera.userData.sceneReady) readyMs = Math.round(now)
      const moving = Boolean(camera.userData.cameraMoving)
      if (moving && !wasMoving) { total = 0; frames = 0; maximum = 0 }
      if (moving && wasMoving) {
        const elapsed = now - last
        total += elapsed; frames++; maximum = Math.max(maximum, elapsed)
      }
      if (!moving && wasMoving && frames) {
        movement = { frames, fps: Math.round(frames * 10000 / total) / 10, averageMs: Math.round(total / frames * 10) / 10, longestMs: Math.round(maximum) }
      }
      if (now - lastPublish > 500 || moving !== wasMoving || previousDpr !== gl.getPixelRatio()) {
        output.textContent = JSON.stringify({ readyMs, dpr: gl.getPixelRatio(), calls: gl.info.render.calls, triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, moving, movement })
        lastPublish = now
        previousDpr = gl.getPixelRatio()
      }
      gl.info.reset(); wasMoving = moving; last = now
    })
    invalidate()
    return () => { stop(); gl.info.autoReset = previousReset }
  }, [gl, camera, invalidate])
  return null
}
