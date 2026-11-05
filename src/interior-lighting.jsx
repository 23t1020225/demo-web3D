import React from 'react'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { balancedLightPanels } from './lighting-profile.js'

RectAreaLightUniformsLib.init()

export function InteriorLighting() {
  return <group name="fixed-house-lighting">
    {balancedLightPanels.map(light => <rectAreaLight key={light.id} name={light.id}
      position={light.at} rotation={light.rotation} width={light.width} height={light.height}
      color={light.color} intensity={light.intensity} />)}
  </group>
}
