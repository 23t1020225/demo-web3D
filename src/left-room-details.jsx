import React from 'react'
import { CatmullRomCurve3, DoubleSide, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { Block, Cylinder, RepeatMeshes, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'

const jug = new LatheGeometry([
  [0, .009], [.054, .009], [.063, .022], [.064, .115], [.073, .186], [.074, .210],
  [.069, .214], [.065, .207], [.065, .187], [.057, .116], [.056, .026], [0, .021],
].map(([r, y]) => new Vector2(r, y)), 28)
const jugHandle = new TubeGeometry(new CatmullRomCurve3([
  [-.065, .180, 0], [-.102, .179, 0], [-.114, .150, 0], [-.112, .089, 0], [-.074, .057, 0], [-.062, .061, 0],
].map(point => new Vector3(...point))), 22, .009, 8, false)
const headphoneBand = new TubeGeometry(new CatmullRomCurve3([
  [-.078, .021, 0], [-.091, .091, 0], [-.048, .139, 0], [.035, .145, 0], [.085, .104, 0], [.079, .025, 0],
].map(point => new Vector3(...point))), 25, .012, 8, false)
const glass = { transparent: true, opacity: .20, metalness: .04, roughness: .12, side: DoubleSide, depthWrite: false, envMapIntensity: .70 }

function WaterJug() {
  return <group position={[-.115, 1.036, .015]} rotation-y={-.12}>
    <mesh geometry={jug} castShadow><meshPhysicalMaterial color="#d5e4e7" {...glass} /></mesh>
    <mesh geometry={jugHandle}><meshPhysicalMaterial color="#e0e7e5" {...glass} opacity={.30} /></mesh>
    <Cylinder at={[0, .069, 0]} height={.092} radius={.056} top={.059} color="#a8c4c7" finish={{ ...glass, opacity: .09 }} />
    <mesh position={[0, .213, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[.072, .0028, 6, 28]} />
      <meshStandardMaterial color="#cedade" transparent opacity={.48} roughness={.22} />
    </mesh>
    <Block at={[.020, -.007, .018]} size={[.156, .004, .106]} color="#d3d4ca" angle={-.16} shadow={false} />
  </group>
}

function SofaItems() {
  return <group position={[-1.79, .692, -1.587]}>
    <Rounded at={[0, .052, 0]} size={[.116, .097, .093]} radius={.006} color="#b8a449" />
    <Block at={[.009, .102, -.005]} size={[.064, .004, .044]} color="#42483f" shadow={false} />
    <group position={[.005, .119, .002]} rotation={[.08, .15, .23]}>
      <Block at={[0, 0, 0]} size={[.042, .042, .003]} color="#dedbd0" shadow={false} />
    </group>
    <group position={[.090, .035, .043]} rotation={[-.52, .20, -.12]}>
      <mesh geometry={headphoneBand}><meshStandardMaterial color="#c7c4af" roughness={.33} /></mesh>
      {[-.078, .078].map(x => <group key={x}>
        <Cylinder at={[x, .025, 0]} height={.039} radius={.035} color="#d6d2be" rotation={[0, 0, Math.PI / 2]} />
        <Cylinder at={[x + Math.sign(x) * .020, .025, 0]} height={.009} radius={.029} color="#6b6d60" rotation={[0, 0, Math.PI / 2]} />
      </group>)}
    </group>
    <RepeatMeshes pieces={[
      { at: [-.147, .004, .064], size: [.166, .007, .116], color: '#ddd6c2', rotation: [0, -.23, 0] },
      { at: [-.149, .010, .064], size: [.170, .005, .120], color: '#526773', rotation: [0, -.23, .016] },
      { at: [-.148, .013, .064], size: [.139, .002, .084], color: '#a5b0a8', rotation: [0, -.23, .016] },
    ]} shadow={false} />
  </group>
}

export function LeftRoomDetails({ onInspect }) {
  return <>
    <RoomItem id="left-water-jug" onInspect={onInspect}><WaterJug /></RoomItem>
    <RoomItem id="left-sofa-items" onInspect={onInspect}><SofaItems /></RoomItem>
  </>
}
