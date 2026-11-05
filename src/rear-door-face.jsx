import React, { useEffect, useMemo } from 'react'
import { PlaneGeometry } from 'three'

// All molding shares the photograph's UVs, so grain continues across the raised edges.
export function RearDoorFace({ map, width, height, panels }) {
  const geometry = useMemo(() => {
    // One continuous surface avoids a second set of panel outlines over the photograph.
    const result = new PlaneGeometry(width, height, 96, Math.ceil(height * 120))
    result.translate(0, height / 2, 0)
    const positions = result.attributes.position
    const profile = [[0, 0], [.004, .003], [.010, .008], [.017, .008], [.026, .002], [.033, .003]]
    for (let vertex = 0; vertex < positions.count; vertex++) {
      const x = positions.getX(vertex), y = positions.getY(vertex)
      let depth = 0
      for (const [px, py, w, h] of panels) {
        const edge = Math.min(w / 2 - Math.abs(x - px), h / 2 - Math.abs(y - py))
        if (edge <= 0) continue
        depth = .003
        for (let band = 1; band < profile.length; band++) {
          if (edge > profile[band][0]) continue
          const [a, za] = profile[band - 1], [b, zb] = profile[band]
          depth = za + (zb - za) * (edge - a) / (b - a)
          break
        }
      }
      positions.setZ(vertex, depth)
    }
    result.computeVertexNormals()
    return result
  }, [width, height, panels])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} receiveShadow castShadow>
    <meshStandardMaterial map={map} roughness={.66} envMapIntensity={.10} />
  </mesh>
}
