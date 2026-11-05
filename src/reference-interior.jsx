import React, { useMemo } from 'react'
import { Color, Vector3 } from 'three'
import { Block, RepeatMeshes } from './model-parts.jsx'
import { roomItems } from './room-items.js'
import { randomFrom } from './surfaces.js'
import { rearCenter, rearDepth, rearDoorCenters, rearPlan, rearTimberZ } from './rear-plan.js'
import { InteriorLighting } from './interior-lighting.jsx'
import { RoomZones } from './room-zones.jsx'
import { PolishedRoomFloor } from './polished-room-floor.jsx'

const floor = .35
const cream = '#eee3ce'
const tiles = []
const random = randomFrom(361)
for (let z = 0; z < 18; z++) {
  for (let x = 0; x < 13; x++) {
    tiles.push({ at: [-3.618 + x * .526, floor - .01, -7.39 + z * .52], size: [.522, .020, .516], color: ['#d3c6ae', '#d4c7b0', '#d6c9b5', '#d4c8b2', '#d1c5af'][Math.floor(random() * 5)] })
  }
}

function GroundContact({ at, size, opacity }) {
  const uniforms = useMemo(() => ({ tint: { value: new Color('#554735') }, strength: { value: opacity } }), [opacity])
  return <mesh position={at} rotation-x={-Math.PI / 2} renderOrder={1}>
    <planeGeometry args={size} />
    <shaderMaterial transparent depthWrite={false} uniforms={uniforms}
      vertexShader="varying vec2 tex; void main() { tex = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
      fragmentShader={`varying vec2 tex; uniform vec3 tint; uniform float strength;
        void main() {
          vec2 d = abs(tex - .5) * 2.0;
          float fade = 1.0 - smoothstep(.15, 1.0, length(d));
          gl_FragColor = vec4(tint, fade * strength);
          #include <colorspace_fragment>
        }`} />
  </mesh>
}

const partitionWalls = [
  // Rear wall of living-left (x = -3.89 to -0.04, z = -2.005)
  { at: [-1.965, 1.69, -2.005], size: [3.85, 2.68, .135] },
  // Continuous central bedroom/kitchen spine wall at x = -0.113 (flush with OpenWall!)
  { at: [-.413, 1.69, -2.16], size: [.145, 2.68, .30] },
  { at: [-.413, 1.69, -4.02], size: [.145, 2.68, 1.82] },
  { at: [-.413, 1.69, -5.83], size: [.145, 2.68, .20] },
  { at: [-.413, 2.805, -2.71], size: [.145, .45, .80] },
  { at: [-.413, 2.805, -5.33], size: [.145, .45, .80] },
  // Back wall of bedroom-left at z = -5.90 (kept behind Phần 3 +Z tiles at z = -5.958)
  { at: [-2.13, 1.69, -5.90], size: [3.54, 2.68, .08] },
  // Phần 3 -X bathroom partition wall at x = -2.40 (kept behind Phần 3 -X tiles at x = -2.352)
  ...[
    [rearDoorCenters[0] + .33, rearPlan.front],
    [rearDoorCenters[1] + .31, rearDoorCenters[0] - .33],
    [rearPlan.back, rearDoorCenters[1] - .31],
  ].map(([start, end]) => ({ at: [-2.65, 1.69, (start + end) / 2], size: [.07, 2.68, end - start] })),
  { at: [-2.65, 2.665, rearCenter[1]], size: [.07, .73, rearDepth] },
  // Phần 3 +X Door #3 wall at x = +0.555 (z = -5.98 to -7.56, with 0.78m door opening at z = -6.55)
  { at: [.555, 1.69, (rearTimberZ + .39 + rearPlan.front) / 2], size: [.13, 2.68, rearPlan.front - rearTimberZ - .39] },
  { at: [.555, 1.69, (rearPlan.back + rearTimberZ - .39) / 2], size: [.13, 2.68, rearTimberZ - .39 - rearPlan.back] },
  { at: [.555, 2.915, rearTimberZ], size: [.13, .23, .78] },
  { at: [1.22, 1.69, -7.13], size: [1.12, 2.68, 1.46] },
]

export function ReferenceInterior({ surfaces, room, active, inside, onInspect, readyZones }) {
  return <group>
    <Block at={[-.46, floor - .035, -3.09]} size={[6.91, .048, 9.75]} color="#a69b88" shadow={false} />
    <RepeatMeshes pieces={tiles} finish={{ roughness: .34, envMapIntensity: .30 }} shadow={false} />
    <PolishedRoomFloor at={[-.46, .3555, -3.095]} size={[6.78, 9.44]} opacity={.14} />
    <Block at={[-.46, 3.018, -3.095]} size={[6.94, .089, 9.76]} color="#eee5d5" />
    {partitionWalls.map((wall, index) => <Block key={index} {...wall} color={cream} finish={surfaces.plaster} />)}
    <Block at={[-3.874, .407, -2.94]} size={[.043, .113, 9.38]} color="#a89b82" />
    <Block at={[2.949, .407, -5.55]} size={[.043, .113, 4.16]} color="#a89b82" />
    <Block at={[2.949, .407, -.40]} size={[.043, .113, 4.30]} color="#a89b82" />
    {[-3.872, 2.94].map(x => <Block key={x} at={[x, 2.949, -2.94]} size={[.05, .067, 9.37]} color="#dfd1b8" />)}

    <GroundContact at={[-2.33, .356, -1.55]} size={[2.03, .94]} opacity={.49} />
    <GroundContact at={[-3.55, .356, -1.095]} size={[.91, 1.78]} opacity={.45} />
    <GroundContact at={[-2.49, .356, -.77]} size={[1.43, .87]} opacity={.35} />
    <GroundContact at={[-2.67, .356, 1.26]} size={[1.78, .56]} opacity={.31} />
    <GroundContact at={[-.67, .356, -1.25]} size={[.68, 1.06]} opacity={.39} />
    <GroundContact at={[2.56, .357, -.25]} size={[.91, 1.98]} opacity={.48} />
    <GroundContact at={[1.65, .357, -.28]} size={[1.05, 1.69]} opacity={.39} />
    {[-.99, .49].map(z => <GroundContact key={z} at={[.81, .357, z]} size={[.87, .83]} opacity={.43} />)}
    <GroundContact at={[1.88, .356, -3.08]} size={[1.55, .95]} opacity={.34} />
    <GroundContact at={[2.04, .356, -6.02]} size={[1.80, .68]} opacity={.42} />
    <GroundContact at={[2.64, .356, -5.02]} size={[.68, 1.50]} opacity={.40} />
    <GroundContact at={[.78, .356, -6.00]} size={[.62, .70]} opacity={.46} />
    <GroundContact at={[2.70, .356, -3.93]} size={[.44, .44]} opacity={.38} />
    <GroundContact at={[-1.52, .356, -6.17]} size={[1.04, .48]} opacity={.40} />
    <RoomZones surfaces={surfaces} room={room} active={active} onInspect={onInspect} readyZones={readyZones} />
    <InteriorLighting />
  </group>
}

const markerPositions = roomItems.map(item => [item.id, new Vector3(...item.at)])
export { markerPositions }
