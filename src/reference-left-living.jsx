import React, { useEffect, useMemo } from 'react'
import { SphereGeometry, Vector2 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { LeftLandscape } from './left-room-landscape.jsx'
import { LeftRoomWorkstations } from './left-room-workstations.jsx'
import { LeftRoomDetails } from './left-room-details.jsx'
import { Block, Cylinder, RepeatMeshes, Rounded } from './model-parts.jsx'
import { Downlights, ReferenceGrilleWindow, rectangularRing } from './reference-right-living.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { paintedTexture, randomFrom } from './surfaces.js'

const floor = .354
const mint = '#cbd6c1'
const wood = '#d2c6aa'
const darkWood = '#b2aa94'
const border = '#d5c9ad'
const ivory = ['#dfdad1', '#dfdbd3', '#e2ded6']
const tile = { roughness: .35, envMapIntensity: .32 }
const easedWood = new RoundedBoxGeometry(1, 1, 1, 2, .036)

const floorTiles = Array.from({ length: 36 }, (_, i) => ({
  at: [-3.881 + (i % 6 + .5) * .594, .350, -1.929 + (Math.floor(i / 6) + .5) * .588],
  size: [.592, .008, .586], color: ['#d8d9d1', '#d7d8d0', '#dcdbd1', '#d9d9d2'][(i + Math.floor(i / 6)) % 4],
}))

function tileRows(at, width, rows, columns, height, angle = 0) {
  const pieces = Array.from({ length: rows * columns }, (_, i) => ({
    at: [((i % columns + .5) / columns - .5) * width, (Math.floor(i / columns) + .5) * height, 0],
    size: [width / columns - .003, height - .0024, .023],
    color: ivory[(i + Math.floor(i / columns)) % ivory.length],
  }))
  return <group position={at} rotation-y={angle}><RepeatMeshes pieces={pieces} finish={tile} shadow={false} /></group>
}

function LeftFinishes({ plaster }) {
  const walls = [
    { at: [-3.869, 1.657, -.157], size: [.019, 2.607, 3.502], color: mint },
    { at: [-2.026, 1.655, -1.927], size: [3.66, 2.609, .029], color: mint },
    { at: [-3.793, 1.662, -1.880], size: [.135, 2.615, .071], color: '#dce2d4' },
    { at: [-.618, 1.654, -1.930], size: [.116, 2.60, .058], color: '#d9e1d0' },
    { at: [-3.712, 1.667, 1.595], size: [.35, 2.629, .034], color: mint },
    { at: [-.717, 1.667, 1.595], size: [1.645, 2.629, .034], color: mint },
    { at: [-2.544, 2.838, 1.593], size: [2.012, .286, .035], color: mint },
    { at: [-2.544, .62, 1.594], size: [2.011, .54, .034], color: mint },
  ]
  return <>
    <RepeatMeshes pieces={floorTiles} finish={tile} shadow={false} />
    <Block at={[-.57, 1.655, -1.995]} size={[.76, 2.609, .136]} color={mint} finish={plaster} />
    <RepeatMeshes pieces={walls} finish={plaster} shadow={false} />
    {tileRows([-3.850, floor, -.166], 3.487, 4, 6, .280, Math.PI / 2)}
    {tileRows([-2.026, floor, -1.899], 3.66, 4, 6, .280)}
    {tileRows([-2.543, floor, 1.563], 2.018, 3, 4, .179, Math.PI)}
    {tileRows([-1.01, floor, 1.561], 1.043, 4, 3, .280, Math.PI)}
    <Block at={[-3.715, .774, 1.563]} size={[.330, .84, .025]} color="#e5e1da" finish={tile} />
    <group position={[-3.827, 1.262, 1.247]} rotation-y={Math.PI / 2}>
      <Rounded at={[0, 0, 0]} size={[.192, .081, .012]} radius={.004} color="#dedbcf" />
      <RepeatMeshes pieces={[
        { at: [-.063, .001, .008], size: [.032, .038, .006], color: '#b2b2a4' },
        ...[.010, .060].flatMap(x => [-.007, .007].map(dx => ({
          at: [x + dx, -.003, .008], size: [.003, .013, .003], color: '#797e74',
        }))),
      ]} shadow={false} />
    </group>
  </>
}

// Soft patterns from the window and columns, drawn once so the floor needs no extra render pass.
function LeftDaylight() {
  const { wall, floorLight } = useMemo(() => ({
    wall: paintedTexture(512, 384, ctx => {
      const pool = ctx.createRadialGradient(359, 237, 0, 359, 237, 183)
      pool.addColorStop(0, '#fff5ce54')
      pool.addColorStop(.55, '#eef2d730')
      pool.addColorStop(1, '#ebf2d500')
      ctx.fillStyle = pool
      ctx.fillRect(0, 0, 512, 384)
      ctx.filter = 'blur(15px)'
      for (const [x, y, width, height] of [[295, 138, 35, 210], [358, 96, 42, 236], [429, 62, 48, 256]]) {
        const fade = ctx.createLinearGradient(0, y, 0, y + height)
        fade.addColorStop(0, '#54634b53')
        fade.addColorStop(.6, '#68745a38')
        fade.addColorStop(1, '#69735900')
        ctx.fillStyle = fade
        ctx.fillRect(x, y, width, height)
        ctx.fillRect(x - 6, y, width + 12, 19)
      }
    }),
    floorLight: paintedTexture(384, 512, ctx => {
      ctx.save()
      ctx.translate(75, 14)
      ctx.transform(1, .09, .20, 1, 0, 0)
      ctx.filter = 'blur(9px)'
      const shine = ctx.createLinearGradient(0, 21, 0, 460)
      shine.addColorStop(0, '#fff7dc69')
      shine.addColorStop(.37, '#f3f5e552')
      shine.addColorStop(.76, '#e6eee22b')
      shine.addColorStop(1, '#e6eee200')
      ctx.fillStyle = shine
      for (let row = 0; row < 6; row++) {
        for (let column = 0; column < 4; column++) {
          ctx.fillRect(column * 48, 24 + row * 68 + (column % 2) * 11, 40, 59)
        }
      }
      ctx.restore()
    }),
  }), [])
  useEffect(() => () => { wall.dispose(); floorLight.dispose() }, [wall, floorLight])
  return <>
    <mesh position={[-2.216, 1.652, -1.876]} renderOrder={1}>
      <planeGeometry args={[3.28, 2.58]} />
      <meshBasicMaterial map={wall} transparent opacity={.40} depthWrite={false} />
    </mesh>
    <mesh position={[-2.17, .355, .63]} rotation={[-Math.PI / 2, 0, Math.PI]} renderOrder={1}>
      <planeGeometry args={[1.67, 1.62]} />
      <meshBasicMaterial map={floorLight} transparent opacity={.40} depthWrite={false} />
    </mesh>
  </>
}

const trayLayers = [
  { geometry: rectangularRing(3.75, 3.59, 2.89, 2.96, .105), height: 2.893, color: '#f1eee7' },
  { geometry: rectangularRing(2.90, 2.97, 1.77, 1.97, .055), height: 2.928, color: '#c9d7c7' },
  { geometry: rectangularRing(1.792, 1.991, 1.724, 1.923, .044), height: 2.9285, color: '#a5b39a' },
]
const ceilingCenter = [-2.018, -.178]
const trayLights = [
  ...[-1.60, 1.60].flatMap(x => [-1.50, 0, 1.50].map(z => [ceilingCenter[0] + x, 2.890, ceilingCenter[1] + z])),
  ...[-1.24, 1.24].map(x => [ceilingCenter[0] + x, 2.925, ceilingCenter[1]]),
  ...[-1.19, 1.19].map(z => [ceilingCenter[0], 2.925, ceilingCenter[1] + z]),
]

function LeftTray() {
  const [x, z] = ceilingCenter
  return <>
    {trayLayers.map(({ geometry, height, color }) => <mesh key={height} geometry={geometry} position={[x, height, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color={color} roughness={.85} />
    </mesh>)}
    <Block at={[x, 2.973, z]} size={[1.80, .029, 2.00]} color="#eeeae4" shadow={false} />
    <Downlights points={trayLights} />
  </>
}

function BenchSection({ at, angle = 0, width, low = false, finish }) {
  const depth = low ? .62 : .68
  const back = low ? .47 : .665
  const backWidth = low ? width - .016 : width + .592
  const backX = low ? 0 : -.304
  const frame = [
    { at: [0, .242, 0], size: [width, .094, depth], color: darkWood },
    { at: [0, .301, 0], size: [width + .014, .047, depth + .014], color: border },
    { at: [0, .325, .028], size: [width - .128, .010, depth - .117], color: '#a29881' },
    { at: [0, .332, .028], size: [width - .141, .011, depth - .132], color: wood },
    { at: [0, .238, depth / 2 + .004], size: [width - .126, .068, .011], color: '#c4b89b' },
    { at: [backX, (back + .285) / 2, -depth / 2 + .042], size: [backWidth, back - .281, .067], color: darkWood },
    { at: [backX, (back + .323) / 2, -depth / 2 + .079], size: [backWidth - .077, back - .376, .011], color: border },
    ...[-depth / 2 + .091, depth / 2 - .099].flatMap(z => [-(width / 2 - .116), width / 2 - .116].map(x => ({
      at: [x, .091, z], size: [.149, .180, .147], color: '#b4a88f',
    }))),
  ]
  const length = width / 3
  return <group position={at} rotation-y={angle}>
    <RepeatMeshes geometry={easedWood} pieces={frame} finish={finish} />
    {low ? [-length, 0, length].map(x =>
      <Rounded key={x} at={[x, back + .004, -depth / 2 + .043]} size={[length - .028, .039, .081]} radius={.014} color={border} finish={finish} />
    ) : <>
      <Rounded at={[backX, back + .004, -depth / 2 + .042]} size={[backWidth - .025, .032, .073]} radius={.009} color={border} finish={finish} />
      <Rounded at={[width / 2 - .051, .456, -.009]} size={[.112, .055, depth + .012]} radius={.012} color={border} finish={finish} />
      <Rounded at={[width / 2 - .052, .267, .249]} size={[.120, .374, .137]} radius={.010} color={darkWood} finish={finish} />
    </>}
  </group>
}

function GlassTable({ finish }) {
  const structure = [
    ...[-.589, .589].map(x => ({ at: [x, .408, 0], size: [.080, .065, .681], color: border })),
    ...[-.304, .304].map(z => ({ at: [0, .408, z], size: [1.106, .065, .073], color: border })),
    { at: [0, .024, 0], size: [1.246, .048, .659], color: darkWood },
    ...[-.568, .568].flatMap(x => [-.276, .276].map(z => ({ at: [x, .216, z], size: [.086, .384, .092], color: wood }))),
  ]
  return <group position={[-2.493, floor, -.771]}>
    <RepeatMeshes pieces={structure} finish={finish} />
    <Rounded at={[0, .443, 0]} size={[1.234, .014, .655]} radius={.003} color="#b3c2b9"
      finish={{ transparent: true, opacity: .64, roughness: .24, metalness: .06, envMapIntensity: .45 }} />
    <Rounded at={[0, .456, 0]} size={[1.170, .009, .596]} radius={.003} color="#bac4bb"
      finish={{ transparent: true, opacity: .07, roughness: .22, metalness: .08, envMapIntensity: .50 }} />
    <group position={[.074, .466, .067]} rotation-y={.27}>
      <Block at={[0, .002, 0]} size={[.232, .007, .154]} color="#d6d1bd" angle={.038} shadow={false} />
      <Block at={[-.007, .006, -.005]} size={[.229, .003, .154]} color="#527783" shadow={false} />
      <RepeatMeshes pieces={[
        { at: [-.055, .009, -.013], size: [.094, .001, .097], color: '#c3c9bb' },
        ...Array.from({ length: 5 }, (_, i) => ({
          at: [.050, .009, -.035 + .012 * i], size: [.068 - (i % 2) * .014, .001, .002], color: '#ced4c5',
        })),
      ]} shadow={false} />
    </group>
  </group>
}

function NestedStools({ finish }) {
  const parts = [-.25, .23].flatMap(x => [
    { at: [x, .285, 0], size: [.446, .043, .436], color: border },
    { at: [x, .160, .198], size: [.402, .193, .041], color: wood },
    ...[-.174, .174].map(dx => ({ at: [x + dx, .136, -.035], size: [.074, .231, .424], color: darkWood })),
    ...[-1, 0, 1].map(i => ({ at: [x, .175 + i * .029, .222], size: [.299, .011, .011], color: darkWood })),
  ])
  return <group position={[-2.493, floor + .0275, -.723]}>
    <RepeatMeshes pieces={parts} finish={finish} />
  </group>
}

const petal = new SphereGeometry(1, 8, 6)
const bouquet = []
const random = randomFrom(114)
for (let i = 0; i < 38; i++) {
  const a = i * 2.39996
  const r = .124 * Math.sqrt(random())
  const x = Math.cos(a) * r
  const z = Math.sin(a) * r * .81
  const y = .09 + .12 * (1 - r * 5) + random() * .055
  bouquet.push({ at: [x * 1.16, y - .031, z * 1.08], size: [.026, .012, .009], rotation: [0, a, .46], color: ['#416640', '#52753f', '#385539'][i % 3] })
  if (i % 4 !== 0) {
    for (let j = 0; j < 3; j++) {
      const b = j * Math.PI * 2 / 3
      bouquet.push({
        at: [x + .009 * Math.cos(b), y, z + .008 * Math.sin(b)], size: [.012, .010, .009], rotation: [b, a, 0],
        color: ['#862f35', '#a93f3d', '#b84c43', '#e4d9c6', '#732c38'][i % 5],
      })
    }
  }
}

function FlowerBowl() {
  return <group position={[-2.399, .827, -.778]}>
    <Cylinder at={[0, .040, 0]} height={.069} radius={.071} top={.099} color="#555347" finish={{ roughness: .36 }} />
    <Cylinder at={[0, .074, 0]} height={.018} radius={.099} top={.102} color="#4c4a3c" />
    <RepeatMeshes geometry={petal} pieces={bouquet} finish={{ roughness: .69 }} shadow={false} />
  </group>
}

function WallTube() {
  return <group position={[-3.825, 2.580, -.647]} rotation-y={Math.PI / 2}>
    <Block at={[0, 0, 0]} size={[1.019, .036, .026]} color="#bbbfb5" finish={{ metalness: .45, roughness: .41 }} />
    <Rounded at={[0, -.002, .022]} size={[.958, .016, .024]} radius={.008} color="#eae8de" />
    {[-.493, .493].map(x => <Block key={x} at={[x, 0, .023]} size={[.036, .033, .037]} color="#666d68" />)}
  </group>
}

export function ReferenceLeftLiving({ surfaces, onInspect }) {
  const grain = useMemo(() => {
    const map = paintedTexture(1024, 1024, ctx => {
      ctx.filter = 'saturate(0.43)'
      ctx.drawImage(surfaces.wood.map.image, 0, 0, 1024, 1024)
    })
    map.anisotropy = 8
    return map
  }, [surfaces.wood.map])
  useEffect(() => () => grain.dispose(), [grain])
  const finish = useMemo(() => ({
    ...surfaces.wood, map: grain, normalScale: new Vector2(.12, .12), roughness: .40, envMapIntensity: .62,
  }), [surfaces.wood, grain])
  return <>
    <LeftFinishes plaster={{ ...surfaces.plaster, map: null, normalMap: null, roughnessMap: null, roughness: .86 }} />
    <LeftDaylight />
    <RoomItem id="left-ceiling" onInspect={onInspect}><LeftTray /></RoomItem>
    <RoomItem id="left-window" onInspect={onInspect}>
      <ReferenceGrilleWindow at={[-2.542, 1.80, 1.632]} angle={Math.PI} scale={[.990, 1.12, 1]} finish={finish} />
    </RoomItem>
    <RoomItem id="sofa" onInspect={onInspect}>
      <BenchSection at={[-2.33, floor, -1.553]} width={1.81} finish={finish} />
      <BenchSection at={[-3.548, floor, -1.095]} width={1.57} angle={Math.PI / 2} low finish={finish} />
    </RoomItem>
    <RoomItem id="table" onInspect={onInspect}><GlassTable finish={finish} /></RoomItem>
    <RoomItem id="left-stools" onInspect={onInspect}><NestedStools finish={finish} /></RoomItem>
    <RoomItem id="left-flowers" onInspect={onInspect}><FlowerBowl /></RoomItem>
    <RoomItem id="art" onInspect={onInspect}><LeftLandscape /></RoomItem>
    <RoomItem id="left-wall-light" onInspect={onInspect}><WallTube /></RoomItem>
    <LeftRoomWorkstations onInspect={onInspect} />
    <LeftRoomDetails onInspect={onInspect} />
  </>
}
