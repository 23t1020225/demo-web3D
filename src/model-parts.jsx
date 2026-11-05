import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Color, CylinderGeometry, DoubleSide, Euler, LatheGeometry, Object3D, PlaneGeometry, Quaternion, Vector2, Vector3 } from 'three'
import { randomFrom } from './surfaces.js'
import { cylinderGeometry, roundedGeometry, standardMaterial } from './model-resources.js'

const cube = new BoxGeometry()
const up = new Vector3(0, 1, 0)
const leaf = new PlaneGeometry(1, 1, 4, 2).rotateX(-Math.PI / 2)
const positions = leaf.attributes.position
for (let index = 0; index < positions.count; index++) {
  const length = positions.getX(index)
  const width = positions.getZ(index)
  const taper = Math.max(.03, Math.cos(length * Math.PI))
  positions.setXYZ(index, length, taper * (.14 - Math.abs(width) * .19) - length * length * .17, width * taper)
}
leaf.computeVertexNormals()

export function Block({ at, size, color = '#ffffff', finish, angle = 0, rotation, shadow = true }) {
  return <mesh geometry={cube} material={standardMaterial(color, .82, finish)} position={at} scale={size} rotation={rotation ?? [0, angle, 0]} castShadow={shadow && size[0] * size[1] * size[2] > .001} receiveShadow />
}

export function Rounded({ at, size, radius, color, finish, angle = 0 }) {
  return <mesh geometry={roundedGeometry(size, radius)} material={standardMaterial(color, .8, finish)} position={at} rotation-y={angle} castShadow={size[0] * size[1] * size[2] > .001} receiveShadow />
}

export function Rod({ from, to, radius, color, taper = 1, sides = 9, finish, shadow = true }) {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  return <mesh geometry={cylinderGeometry(radius * taper, radius, direction.length(), sides)} material={standardMaterial(color, .74, finish)} position={start.lerp(end, .5)} quaternion={new Quaternion().setFromUnitVectors(up, direction.clone().normalize())} castShadow={shadow && radius >= .01} receiveShadow />
}

export function Cylinder({ at, height, radius, top = radius, color, finish, rotation, shadow = true }) {
  return <mesh geometry={cylinderGeometry(top, radius, height, radius < .04 ? 12 : 20)} material={standardMaterial(color, .68, finish)} position={at} rotation={rotation} castShadow={shadow && radius >= .035} receiveShadow />
}

export function RepeatMeshes({ pieces, geometry = cube, finish, shadow = true, distantGeometry, detailDistance = 9 }) {
  const mesh = useRef(null)
  useLayoutEffect(() => {
    const item = new Object3D()
    const color = new Color()
    for (const [index, part] of pieces.entries()) {
      item.position.fromArray(part.at)
      item.scale.fromArray(part.size ?? [1, 1, 1])
      item.rotation.set(...(part.rotation ?? [0, 0, 0]))
      item.updateMatrix()
      mesh.current.setMatrixAt(index, item.matrix)
      mesh.current.setColorAt(index, color.set(part.color))
    }
    mesh.current.instanceMatrix.needsUpdate = true
    mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  }, [pieces])
  return <instancedMesh ref={mesh} args={[geometry, standardMaterial('#ffffff', .86, finish), pieces.length]} castShadow={shadow} receiveShadow>
    {distantGeometry && <InstanceDetail mesh={mesh} near={geometry} far={distantGeometry} distance={detailDistance} />}
  </instancedMesh>
}

function InstanceDetail({ mesh, near, far, distance }) {
  const center = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    const instances = mesh.current
    if (!instances?.boundingSphere) return
    instances.updateWorldMatrix(true, false)
    center.copy(instances.boundingSphere.center).applyMatrix4(instances.matrixWorld)
    const threshold = distance + (instances.geometry === near ? .65 : -.65)
    instances.geometry = camera.position.distanceToSquared(center) < threshold * threshold ? near : far
  })
  return null
}

export function Glass({ at, size, opacity = .22 }) {
  return <mesh position={at} renderOrder={1}>
    <planeGeometry args={size} />
    <meshStandardMaterial color="#9eb4a9" transparent opacity={opacity} depthWrite={false} side={DoubleSide} roughness={.23} metalness={.08} envMapIntensity={.50} />
  </mesh>
}

export function Window({ at, width, height, panes = 2, angle = 0, frame = '#3b4640', reflection = .21, bars = false }) {
  return <group position={at} rotation-y={angle}>
    {[-height / 2, height / 2].map(y => <Block key={y} at={[0, y, 0]} size={[width + .057, .066, .137]} color={frame} />)}
    {Array.from({ length: panes + 1 }, (_, index) => <Block key={index} at={[-width / 2 + index * width / panes, 0, 0]} size={[.057, height, .137]} color={frame} />)}
    <Block at={[0, height * .27, .012]} size={[width, .035, .095]} color={frame} />
    {bars && [-.25, -.08, .09, .26].map(fraction => <Block key={fraction} at={[0, height * fraction, .094]} size={[width, .018, .023]} color={frame} />)}
    {Array.from({ length: panes }, (_, index) => <Glass key={index} at={[-width / 2 + (index + .5) * width / panes, 0, .033]} size={[width / panes - .045, height - .05]} opacity={reflection} />)}
    <Block at={[0, -.045, .082]} size={[.026, .135, .049]} color="#9a805f" />
  </group>
}

const pot = new LatheGeometry([
  [.001, 0], [.145, 0], [.157, .025], [.183, .088], [.212, .196], [.226, .296], [.229, .322], [.241, .324], [.241, .345], [.209, .35], [.194, .282], [.156, .10], [.001, .095],
].map(([x, y]) => new Vector2(x, y)), 34)

function palmLeaves(seed, height, fronds, spread) {
  const random = randomFrom(seed)
  const leaves = []
  const rotation = new Euler()
  for (let frond = 0; frond < fronds; frond++) {
    const azimuth = frond * 2.4 + random() * .35
    const stemHeight = height * (.82 + random() * .3)
    const reach = spread * (.75 + random() * .45)
    for (let i = 0; i < 11; i++) {
      const t = (i + 1) / 12
      const x = Math.cos(azimuth) * reach * t
      const z = Math.sin(azimuth) * reach * t
      const y = stemHeight + Math.sin(t * Math.PI * .92) * reach * .47
      for (const side of [-1, 1]) {
        const yaw = azimuth + side * (1.19 - .62 * t)
        rotation.set(.08 * side, -yaw, -.34 - .56 * t, 'YXZ')
        const length = reach * (.15 + .42 * Math.sin(t * Math.PI * .91))
        leaves.push({
          at: [x + Math.cos(yaw) * length * .39, y - .045, z + Math.sin(yaw) * length * .39],
          size: [length, length * .8, length * .23], rotation: [rotation.x, rotation.y, rotation.z, rotation.order],
          color: ['#456b30', '#63843a', '#809b42', '#355b2c'][(frond + i) % 4],
        })
      }
    }
  }
  return leaves
}

export function Palm({ at, scale = 1, seed = 9, planted = false, shade = '#a66c4e' }) {
  const height = planted ? 2.1 : .95
  const reach = planted ? 1.12 : .56
  const leaves = useMemo(() => palmLeaves(seed, height, planted ? 11 : 8, reach), [seed, height, planted, reach])
  const trunk = planted ? .074 : .024

  return <group position={at} scale={scale}>
    {!planted && <mesh geometry={pot} castShadow receiveShadow><meshStandardMaterial color={shade} roughness={.58} /></mesh>}
    {!planted && <Cylinder at={[0, .299, 0]} height={.026} radius={.194} color="#4e3d2b" />}
    <Rod from={[0, planted ? 0 : .29, 0]} to={[0, height + .1, 0]} radius={trunk} color="#86704e" taper={.73} />
    {planted && Array.from({ length: 13 }, (_, index) => <Cylinder key={index} at={[0, .23 + index * .132, 0]} height={.024} radius={trunk * (1 - index * .018)} color="#968363" shadow={false} />)}
    <RepeatMeshes pieces={leaves} geometry={leaf} finish={{ side: DoubleSide, roughness: .74 }} />
  </group>
}

export function Bougainvillea({ at, scale = 1, seed = 11 }) {
  const pieces = useMemo(() => {
    const random = randomFrom(seed)
    return Array.from({ length: 380 }, (_, i) => {
      const flower = i % 7 < 3
      const angle = random() * Math.PI * 2
      const radius = Math.sqrt(random())
      const x = Math.cos(angle) * radius * .76
      const z = Math.sin(angle) * radius * .42
      const y = .38 + (1 - radius) * .41 + random() * .33
      const size = (flower ? .057 : .093) + random() * .055
      return { at: [x, y, z], size: [size, size, size * .75], rotation: [random() * 2, angle, random() - .5], color: flower ? ['#ce4c74', '#bc395b', '#ef7894'][i % 3] : ['#4e6d35', '#5c7734', '#6e863c'][i % 3] }
    })
  }, [seed])
  return <group position={at} scale={scale}>
    <mesh geometry={pot} castShadow receiveShadow><meshStandardMaterial color="#a86e52" roughness={.72} /></mesh>
    <Rod from={[0, .27, 0]} to={[-.43, .6, .03]} radius={.028} taper={.35} color="#795940" />
    <Rod from={[0, .27, 0]} to={[.53, .58, .06]} radius={.023} taper={.28} color="#795940" />
    <RepeatMeshes pieces={pieces} geometry={leaf} finish={{ side: DoubleSide, roughness: .79 }} />
  </group>
}

export const ridgeTile = new CylinderGeometry(.128, .128, .351, 12, 1, true, 0, Math.PI).rotateX(-Math.PI / 2)
