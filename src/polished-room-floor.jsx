import React, { useEffect, useMemo } from 'react'
import { Matrix4, PlaneGeometry } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { lightingProfile } from './lighting-profile.js'
import { deviceQuality } from './quality-profile.js'
import { refreshReflection } from './reflection-policy.js'

export function PolishedRoomFloor({ at = [-2.08, .3555, -.17], size: planeSize = [3.51, 3.48], opacity = lightingProfile.reflection }) {
  const [x, y, z] = at
  const [width, depth] = planeSize
  const floor = useMemo(() => {
    const size = deviceQuality().reflectionSize
    const surface = new Reflector(new PlaneGeometry(width, depth), {
      textureWidth: size, textureHeight: size, multisample: 0, clipBias: .002,
    })
    surface.position.set(x, y, z)
    surface.rotation.x = -Math.PI / 2
    surface.renderOrder = 2
    surface.material.transparent = true
    surface.material.depthWrite = false
    surface.material.uniforms.reflectionStrength = { value: opacity }
    surface.material.fragmentShader = 'uniform float reflectionStrength;\n' + surface.material.fragmentShader.replace(
      'vec4 base = texture2DProj( tDiffuse, vUv );',
      `vec2 uv = vUv.xy / vUv.w;
      vec2 texel = vec2(3.2 / ${size.toFixed(1)});
      vec4 base = texture2D(tDiffuse, uv) * .4;
      base += texture2D(tDiffuse, uv + vec2(texel.x, 0.0)) * .15;
      base += texture2D(tDiffuse, uv - vec2(texel.x, 0.0)) * .15;
      base += texture2D(tDiffuse, uv + vec2(0.0, texel.y)) * .15;
      base += texture2D(tDiffuse, uv - vec2(0.0, texel.y)) * .15;`,
    ).replace('vec4( blendOverlay( base.rgb, color ), 1.0 )', 'vec4( base.rgb, reflectionStrength )')

    const drawReflection = surface.onBeforeRender
    const world = new Matrix4()
    const projection = new Matrix4()
    let updatedAt = -Infinity, revision = -1
    surface.onBeforeRender = function (renderer, scene, camera) {
      const now = performance.now()
      const nextRevision = scene.userData.visualRevision || 0
      const changed = !world.equals(camera.matrixWorld) || !projection.equals(camera.projectionMatrix) || revision !== nextRevision
      if (!refreshReflection(changed, camera.userData.cameraMoving, now - updatedAt)) return
      drawReflection.call(this, renderer, scene, camera)
      world.copy(camera.matrixWorld)
      projection.copy(camera.projectionMatrix)
      updatedAt = now
      revision = nextRevision
    }
    return surface
  }, [x, y, z, width, depth, opacity])

  useEffect(() => () => { floor.geometry.dispose(); floor.dispose() }, [floor])
  return <primitive object={floor} />
}
