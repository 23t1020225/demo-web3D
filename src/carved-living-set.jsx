import React, { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { ExtrudeGeometry, Shape, Vector3 } from 'three'
import { PackedGeometryLoader } from './geometry-loader.js'
import chairNearUrl from './assets/models/chair-near.geometry.bin?url'
import chairFarUrl from './assets/models/chair-far.geometry.bin?url'
import benchNearUrl from './assets/models/bench-near.geometry.bin?url'
import benchFarUrl from './assets/models/bench-far.geometry.bin?url'
import { RepeatMeshes, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'

const wood = '#a04d32'
const frame = '#863b26'
const edge = '#b36643'
const modelUrls = [chairNearUrl, chairFarUrl, benchNearUrl, benchFarUrl]

const legOutline = new Shape()
legOutline.moveTo(-.053, .269)
legOutline.lineTo(.084, .269)
legOutline.bezierCurveTo(.064, .197, .112, .14, .081, .062)
legOutline.quadraticCurveTo(.07, .032, .055, .014)
legOutline.lineTo(-.012, .014)
legOutline.bezierCurveTo(-.044, .044, .021, .106, -.04, .171)
legOutline.quadraticCurveTo(-.074, .209, -.053, .269)
const leg = new ExtrudeGeometry(legOutline, { depth: .066, bevelEnabled: true, bevelSize: .011, bevelThickness: .011, bevelSegments: 2, curveSegments: 7 })
leg.translate(0, 0, -.033)

function Feet({ width, depth, height, finish }) {
  const pieces = [-1, 1].flatMap(x => [-1, 1].map(z => ({
    at: [x * (width / 2 - .091), 0, z * (depth / 2 - .091)],
    size: [1, height / .28, 1], rotation: [0, Math.atan2(-z, x), 0], color: frame,
  })))
  return <RepeatMeshes geometry={leg} pieces={pieces} finish={finish} />
}

function TeaTable({ at, width, depth, height, finish, remote }) {
  return <group position={at}>
    <Feet width={width} depth={depth} height={height - .087} finish={finish} />
    <Rounded at={[0, height - .079, 0]} size={[width - .05, .105, depth - .054]} radius={.014} color={frame} finish={finish} />
    <Rounded at={[0, height - .018, 0]} size={[width, .054, depth]} radius={.014} color={edge} finish={finish} />
    <Rounded at={[0, height + .009, 0]} size={[width - .094, .014, depth - .097]} radius={.006} color={frame} finish={finish} />
    <Rounded at={[0, height + .015, 0]} size={[width - .108, .011, depth - .111]} radius={.004} color={wood} finish={finish} />
    {remote && <group position={[.15, height + .028, -.42]} rotation-y={-.22}>
      <Rounded at={[0, 0, 0]} size={[.044, .014, .149]} radius={.006} color="#252724" />
      <RepeatMeshes pieces={Array.from({ length: 12 }, (_, i) => ({
        at: [(i % 3 - 1) * .010, .008, (Math.floor(i / 3) - 1.5) * .019],
        size: [.006, .003, .008], color: i === 0 ? '#a84842' : '#686964',
      }))} shadow={false} />
    </group>}
  </group>
}

function CarvedSeat({ near, far, finish }) {
  const mesh = useRef(null)
  const center = useMemo(() => new Vector3(), [])
  useFrame(({ camera }) => {
    mesh.current.getWorldPosition(center)
    const threshold = mesh.current.geometry === near ? 3.8 : 3.2
    mesh.current.geometry = camera.position.distanceToSquared(center) < threshold * threshold ? near : far
  })
  return <mesh ref={mesh} geometry={near} castShadow receiveShadow>
    <meshStandardMaterial {...finish} vertexColors roughness={.49} />
  </mesh>
}

export function CarvedLivingSet({ finish, onInspect }) {
  const [chairNear, chairFar, benchNear, benchFar] = useLoader(PackedGeometryLoader, modelUrls)
  return <>
    <RoomItem id="carved-bench" onInspect={onInspect}>
      <group position={[2.57, .352, -.25]} rotation-y={-Math.PI / 2}>
        <CarvedSeat near={benchNear} far={benchFar} finish={finish} />
      </group>
    </RoomItem>
    <RoomItem id="armchairs" onInspect={onInspect}>
      {[-.99, .49].map(z => <group key={z} position={[.81, .352, z]} rotation-y={Math.PI / 2}>
        <CarvedSeat near={chairNear} far={chairFar} finish={finish} />
      </group>)}
    </RoomItem>
    <RoomItem id="wood-tea-table" onInspect={onInspect}>
      <TeaTable at={[1.66, .352, -.28]} width={.72} depth={1.43} height={.46} finish={finish} remote />
    </RoomItem>
    <RoomItem id="wood-stool" onInspect={onInspect}>
      <TeaTable at={[.83, .352, -.25]} width={.43} depth={.40} height={.351} finish={finish} />
    </RoomItem>
  </>
}
