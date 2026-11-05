import React, { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { CatmullRomCurve3, CircleGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, LatheGeometry, Path, PlaneGeometry, Shape, SRGBColorSpace, TextureLoader, TorusGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { KitchenCabinetry } from './kitchen-cabinetry.jsx'
import { KitchenDining } from './kitchen-dining.jsx'
import { Block, Cylinder, Glass, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { Downlights } from './reference-right-living.jsx'
import { RoomItem } from './room-furnishings.jsx'
import lotusUrl from './assets/kitchen-lotus-art.webp'
import deerUrl from './assets/kitchen-deer-art.webp'

const floor = .354
const mint = '#c6dec3'
const timber = '#3b1b14'
const timberPanel = '#4e2419'
const honey = '#c48a51'
const iron = '#35352f'
const gold = { roughness: .28, metalness: .68, envMapIntensity: .9 }
const copper = { roughness: .26, metalness: .64, envMapIntensity: .88 }
const glazedWhite = { roughness: .35, envMapIntensity: .32 }
const floorGlaze = { roughness: .34, envMapIntensity: .30 }

const floorTiles = []
for (let rz = 0; rz < 8; rz++) {
  for (let cx = 0; cx < 5; cx++) {
    if (rz === 7 && cx === 0) continue
    const x = -.03 + (cx + .5) * .594
    const z = -1.94 - (rz + .5) * .556
    floorTiles.push({
      at: [x, .350, z],
      size: [.591, .008, .553],
      color: ['#e2e3de', '#e0e1dc', '#e5e5e0', '#dfdfd9'][(cx + rz) % 4],
    })
  }
}

function addTileWall(list, x0, z0, length, alongZ, bottom, top, cols, rows, faceOffset = 0) {
  const w = length / cols
  const h = (top - bottom) / rows
  const shades = ['#efeee9', '#f2f1ed', '#ecebe6', '#f0efeb']
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const along = (c + .5) * w
      const y = bottom + (r + .5) * h
      list.push({
        at: alongZ ? [x0 + faceOffset, y, z0 + along] : [x0 + along, y, z0 + faceOffset],
        size: alongZ ? [.018, h - .003, w - .003] : [w - .003, h - .003, .018],
        color: shades[(r + c) % shades.length],
      })
    }
  }
}

const dadoTiles = []
// -Z Corner pier left of fridge (4 courses matching corridor) + Stove/fridge wall (6 courses, x = 0.62 to 2.93)
addTileWall(dadoTiles, .49, -5.98, .13, false, floor, 1.394, 1, 4)
addTileWall(dadoTiles, .62, -6.32, 2.31, false, floor, 1.834, 8, 6)
// +X Exterior wall segments (x = 2.922)
addTileWall(dadoTiles, 2.922, -6.32, 1.04, true, floor, 1.834, 4, 6)
addTileWall(dadoTiles, 2.922, -5.28, .92, true, floor, 1.15, 3, 3)
addTileWall(dadoTiles, 2.922, -4.36, .89, true, floor, 1.834, 3, 6)
addTileWall(dadoTiles, 2.922, -2.55, .50, true, floor, 2.38, 2, 8)
// -X Continuous bedroom spine wall (x = -0.030, 4 courses up to y = 1.394 matching OpenWall!)
addTileWall(dadoTiles, -.330, -2.26, .185, true, floor, 1.394, 1, 4)
addTileWall(dadoTiles, -.330, -4.88, 1.72, true, floor, 1.394, 5, 4)
addTileWall(dadoTiles, -.330, -5.93, .15, true, floor, 1.394, 1, 4)

// Floor infill in the 30 cm entrance recess beside the rear bedroom doorway.
for (let row = 0; row < 7; row++) {
  const front = -2.06 - row * .556
  const depth = Math.min(.556, front + 5.95)
  floorTiles.push({ at: [-.18, .351, front - depth / 2], size: [.298, .008, depth - .003], color: '#e2e3de' })
}

// Stepped +Z Divider wall (-Z kitchen side at z = -2.062), keeping TV niche [1.68..2.64, 0.89..1.49] open
const steppedCols = [
  [.488, .96, .733, 2, 1],
  [.96, 1.46, 1.123, 2, 3],
  [1.46, 1.68, 1.503, 1, 4],
  [1.68, 1.96, .89, 1, 2],
  [1.96, 2.47, .89, 2, 2],
  [1.96, 2.47, 1.943, 2, 2, 1.49],
  [2.47, 2.64, .89, 1, 2],
  [2.47, 2.935, 2.353, 2, 3, 1.49],
  [2.64, 2.935, 1.49, 1, 4],
]
for (const [x1, x2, top, cols, rows, base = floor] of steppedCols) {
  addTileWall(dadoTiles, x1, -2.062, x2 - x1, false, base, top, cols, rows)
}

const dividerBackTrims = [
  { at: [.45, 1.645, -2.064], size: [.075, 2.47, .016], color: honey },
  { at: [.705, .76, -2.065], size: [.51, .054, .020], color: '#c18c54' },
  { at: [1.21, 1.15, -2.065], size: [.50, .054, .020], color: '#c18c54' },
  { at: [1.71, 1.53, -2.065], size: [.50, .054, .020], color: '#c18c54' },
  { at: [2.215, 1.97, -2.065], size: [.51, .054, .020], color: '#c18c54' },
  { at: [2.705, 2.38, -2.065], size: [.47, .054, .020], color: '#c18c54' },
]

function bar(x1, y1, x2, y2, width = .022) {
  return x1 === x2
    ? { at: [x1, (y1 + y2) / 2, 0], size: [width, Math.abs(y2 - y1) + width, .022], color: iron }
    : { at: [(x1 + x2) / 2, y1, 0], size: [Math.abs(x2 - x1) + width, width, .022], color: iron }
}

const sinkWindowGrille = [
  ...[-.48, -.31, .31, .46].map(y => bar(-.39, y, .39, y)),
  ...[-.39, -.23, -.09, .09, .23, .39].map(x => bar(x, -.48, x, .46)),
  bar(-.09, -.22, .09, -.22),
  bar(-.09, .18, .09, .18),
  ...[-1, 1].flatMap(s => [
    bar(s * .39, -.14, s * .23, -.14),
    bar(s * .39, .12, s * .23, .12),
    bar(s * .23, -.02, s * .09, -.02),
  ]),
]

function KitchenSinkWindow({ woodFinish, onInspect }) {
  const w = .92
  const h = 1.46
  const frame = [
    ...[-1, 1].map(s => ({ at: [s * (w / 2 - .038), 0, 0], size: [.076, h, .15], color: timber })),
    { at: [0, h / 2 - .038, 0], size: [w, .076, .15], color: timber },
    { at: [0, -h / 2 + .032, 0], size: [w, .064, .15], color: timber },
    { at: [0, .33, 0], size: [w - .08, .058, .145], color: timber },
  ]
  return <RoomItem id="kitchen-window" onInspect={onInspect}>
    <group position={[2.975, 1.88, -4.82]} rotation-y={-Math.PI / 2}>
      <RepeatMeshes pieces={frame} finish={woodFinish} />
      {/* Upper dark solid wooden transom panel */}
      <Rounded at={[0, .51, 0]} size={[w - .15, .30, .09]} radius={.008} color={timber} finish={woodFinish} />
      <Rounded at={[0, .51, .048]} size={[w - .25, .21, .022]} radius={.006} color={timberPanel} finish={woodFinish} />
      {/* Lower iron security grille (open to sunlit exterior yard) */}
      <group position={[0, -.15, .02]}>
        <RepeatMeshes pieces={sinkWindowGrille} finish={{ roughness: .42, metalness: .45 }} shadow={false} />
      </group>
      <Rounded at={[0, -h / 2 - .014, .035]} size={[w + .06, .028, .19]} radius={.005} color="#262828" finish={{ roughness: .22 }} />
    </group>
    {/* Fluorescent tube light mounted above window */}
    <group position={[2.918, 2.75, -4.82]} rotation-y={-Math.PI / 2}>
      <Block at={[0, 0, 0]} size={[1.14, .034, .026]} color="#cfd2ca" finish={{ metalness: .35, roughness: .42 }} />
      <Rounded at={[0, -.002, .022]} size={[1.08, .018, .022]} radius={.008} color="#f5f4ec"
        finish={{ emissive: '#fff1df', emissiveIntensity: .18, roughness: .25 }} />
      {[-.55, .55].map(x => <Block key={x} at={[x, 0, .018]} size={[.028, .032, .034]} color="#595e58" />)}
    </group>
  </RoomItem>
}

const broomHead = new LatheGeometry([
  [0, 0], [.13, 0], [.11, .12], [.065, .25], [.026, .36], [0, .36],
].map(([r, y]) => new Vector2(r, y)), 16)

function SideDoorway({ woodFinish, onInspect }) {
  const w = .92
  const h = 2.26
  const frame = [
    ...[-1, 1].map(s => ({ at: [s * (w / 2 - .038), h / 2, 0], size: [.076, h, .16], color: timber })),
    { at: [0, h - .038, 0], size: [w + .04, .076, .16], color: timber },
    { at: [0, 1.86, 0], size: [w - .07, .058, .155], color: timber },
  ]
  return <>
    <RoomItem id="side-door" onInspect={onInspect}>
      <group position={[2.985, floor, -3.01]} rotation-y={-Math.PI / 2}>
        <RepeatMeshes pieces={frame} finish={woodFinish} />
        {/* Upper wooden transom panel */}
        <Rounded at={[0, 2.04, 0]} size={[w - .14, .30, .09]} radius={.008} color={timber} finish={woodFinish} />
        <Rounded at={[0, 2.04, .046]} size={[w - .24, .21, .020]} radius={.006} color={timberPanel} finish={woodFinish} />
        {/* Outward-swung wooden door leaf */}
        <group position={[-w / 2 + .05, .92, -.07]} rotation-y={1.48}>
          <Rounded at={[.40, 0, 0]} size={[.80, 1.82, .042]} radius={.006} color={timberPanel} finish={woodFinish} />
        </group>
        {/* Threshold step, woven doormat & small black pot */}
        <Block at={[0, .006, -.02]} size={[w - .06, .016, .20]} color="#b8b4a8" />
        <Cylinder at={[.16, .006, .22]} height={.010} radius={.22} color="#7c4e3d" finish={{ roughness: .94 }} />
        <Cylinder at={[.24, .052, .14]} height={.09} radius={.068} top={.082} color="#222526" />
      </group>
    </RoomItem>
    {/* Sorghum broom leaning in the corner between side door and divider */}
    <group position={[2.85, floor, -2.43]} rotation={[.05, 0, .09]}>
      <mesh geometry={broomHead} castShadow><meshStandardMaterial color="#b49663" roughness={.92} /></mesh>
      <Cylinder at={[0, .33, 0]} height={.045} radius={.032} color="#9e3b33" />
      <Rod from={[0, .35, 0]} to={[0, 1.22, 0]} radius={.012} color="#8c6e4b" />
    </group>
  </>
}

function PaneledWoodDoorLeaf({ width = .82, height = 1.78, finish, talisman = false }) {
  const panels = [
    ...[-.20, .20].flatMap(z => [.52, -.52].map(y => ({
      at: [0, y, z], size: [.058, .46, .24], color: '#703425',
    }))),
    ...[-.21, .21].map(z => ({ at: [0, 0, z], size: [.058, .36, .18], color: '#703425' })),
    { at: [0, 0, 0], size: [.062, .22, .16], color: '#5b281c' },
  ]
  return <group position={[0, 0, width / 2]}>
    <Rounded at={[0, 0, 0]} size={[.042, height, width]} radius={.006} color={timber} finish={finish} />
    <RepeatMeshes pieces={panels} finish={finish} />
    {talisman && <Block at={[.032, .33, 0]} size={[.002, .13, .045]} color="#e6dec4" shadow={false} />}
    <Cylinder at={[.032, -.05, width / 2 - .06]} height={.018} radius={.016} rotation={[0, 0, Math.PI / 2]} color="#a78652" />
  </group>
}

function BedroomDoorUnit({ z, leafAngle, talisman = false, curtainRod = false, finish }) {
  const w = .80
  const h = 2.24
  const casing = [
    // Deep door jambs & transom rail
    ...[-1, 1].map(s => ({ at: [0, h / 2, s * (w / 2 + .026)], size: [.176, h + .03, .062], color: timber })),
    { at: [0, h + .005, 0], size: [.180, .072, w + .11], color: timber },
    { at: [0, 1.80, 0], size: [.172, .056, w + .03], color: timber },
    // Stepped molded architrave trim on +X kitchen face
    ...[-1, 1].map(s => ({ at: [.092, h / 2 + .01, s * (w / 2 + .040)], size: [.016, h + .06, .068], color: timberPanel })),
    { at: [.094, h + .028, 0], size: [.020, .068, w + .15], color: timberPanel },
    { at: [.091, 1.80, 0], size: [.014, .048, w + .02], color: timberPanel },
  ]
  return <group position={[-.113, floor, z]}>
    {/* Black speckled granite doorway threshold strip */}
    <Block at={[0, .0035, 0]} size={[.156, .007, w + .04]} color="#232628" finish={{ roughness: .22, metalness: .08 }} />
    <RepeatMeshes pieces={casing} finish={finish} />
    {/* Raised beveled wooden transom panel above doorway */}
    <Rounded at={[.012, 2.00, 0]} size={[.115, .32, w - .01]} radius={.008} color={timber} finish={finish} />
    <Rounded at={[.072, 2.00, 0]} size={[.024, .215, w - .14]} radius={.006} color={timberPanel} finish={finish} />
    {curtainRod && <group position={[.036, 1.62, 0]}>
      <Rod from={[0, 0, -w / 2 + .018]} to={[0, 0, w / 2 - .018]} radius={.0085} color="#cfd4d2"
        finish={{ metalness: .76, roughness: .22 }} />
      {[-1, 1].map(s => <Cylinder key={s} at={[0, 0, s * (w / 2 - .014)]} height={.018} radius={.012}
        rotation={[Math.PI / 2, 0, 0]} color="#1d1f20" />)}
      <Cylinder at={[0, 0, -.04]} height={.026} radius={.0105} rotation={[Math.PI / 2, 0, 0]} color="#262829" />
      <Block at={[.008, -.016, w / 2 - .09]} size={[.010, .028, .016]} color="#252728" />
    </group>}
    {/* Hinged wooden door leaf */}
    <group position={[-.034, .89, -w / 2 + .02]} rotation-y={leafAngle}>
      <PaneledWoodDoorLeaf width={w - .04} height={1.76} finish={finish} talisman={talisman} />
    </group>
  </group>
}

function SecondBedroomPocket() {
  // Compact dim interior pocket directly behind Door 2 (z = -5.33) so it never clips bedroom-left
  return <group>
    <Block at={[-.58, 1.65, -4.89]} size={[.82, 2.60, .06]} color="#babeb8" />
    <Block at={[-.98, 1.65, -5.37]} size={[.06, 2.60, .98]} color="#b4b8b2" />
  </group>
}

function LotusPainting({ onInspect }) {
  const lotus = useLoader(TextureLoader, lotusUrl)
  useMemo(() => {
    lotus.colorSpace = SRGBColorSpace
    lotus.anisotropy = 8
    lotus.needsUpdate = true
  }, [lotus])

  return <RoomItem id="lotus-art" onInspect={onInspect}>
    <group position={[2.916, 2.27, -3.91]} rotation-y={-Math.PI / 2}>
      <Rounded at={[0, 0, 0]} size={[.56, .70, .028]} radius={.008} color="#b7964d" finish={gold} />
      <Block at={[0, 0, .012]} size={[.50, .64, .010]} color="#dfd9c8" />
      <Block at={[0, 0, .015]} size={[.475, .615, .008]} color="#9e7f3e" finish={gold} />
      <mesh position-z={.020}>
        <planeGeometry args={[.455, .595]} />
        <meshStandardMaterial map={lotus} roughness={.36} envMapIntensity={.32} />
      </mesh>
    </group>
  </RoomItem>
}

function uvMappedPlane(width, height, u0, u1, v0, v1) {
  const geo = new PlaneGeometry(width, height)
  const { uv } = geo.attributes
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
  }
  return geo
}

function uvMappedDisc(radius, u0, u1, v0, v1) {
  const geo = new CircleGeometry(radius, 48)
  const { uv } = geo.attributes
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0))
  }
  return geo
}

const leftWingGeo = uvMappedPlane(.40, .23, .0, .36, .08, .92)
const rightWingGeo = uvMappedPlane(.40, .23, .64, 1.0, .08, .92)
const centerDiscGeo = uvMappedDisc(.182, .31, .69, .02, .98)
const goldRingGeo = new TorusGeometry(.184, .0055, 8, 48)

const sconceShade = new LatheGeometry([
  [.026, .095], [.052, 0], [.048, 0], [.023, .095],
].map(([r, y]) => new Vector2(r, y)), 20)

function DeerWallArtAndSconce({ onInspect }) {
  const mural = useLoader(TextureLoader, deerUrl)
  useMemo(() => {
    mural.colorSpace = SRGBColorSpace
    mural.anisotropy = 8
    mural.needsUpdate = true
  }, [mural])

  const crystal = { map: mural, roughness: .16, metalness: .06, envMapIntensity: .55 }

  return <RoomItem id="deer-art" onInspect={onInspect}>
    {/* 3-part modern crystal-glaze deer & moon wall art */}
    <group position={[-.030, 2.08, -4.02]} rotation-y={Math.PI / 2}>
      <Block at={[-.33, 0, .006]} size={[.405, .235, .012]} color="#1d2b30" />
      <mesh geometry={leftWingGeo} position={[-.33, 0, .013]}>
        <meshStandardMaterial {...crystal} />
      </mesh>
      <Block at={[.33, 0, .006]} size={[.405, .235, .012]} color="#1d2b30" />
      <mesh geometry={rightWingGeo} position={[.33, 0, .013]}>
        <meshStandardMaterial {...crystal} />
      </mesh>
      <Cylinder at={[0, 0, .012]} height={.014} radius={.183} rotation={[Math.PI / 2, 0, 0]} color="#223036" />
      <mesh geometry={centerDiscGeo} position={[0, 0, .020]}>
        <meshStandardMaterial {...crystal} />
      </mesh>
      <mesh geometry={goldRingGeo} position={[0, 0, .021]}>
        <meshStandardMaterial color="#d4b15f" {...gold} />
      </mesh>
    </group>

    {/* Copper / rose-gold wall sconce above left wing & outlet */}
    <group position={[-.030, 2.50, -3.50]} rotation-y={Math.PI / 2}>
      <Rounded at={[0, 0, .008]} size={[.072, .145, .016]} radius={.006} color="#c57f62" finish={copper} />
      <Rod from={[0, .02, .016]} to={[0, .045, .078]} radius={.007} color="#b88958" finish={gold} />
      <Cylinder at={[0, .052, .080]} height={.022} radius={.026} color="#b88958" finish={gold} />
      <mesh geometry={sconceShade} position={[0, .062, .080]}>
        <meshStandardMaterial color="#f3efe6" roughness={.42} emissive="#f8ebd2" emissiveIntensity={.22} side={DoubleSide} />
      </mesh>
    </group>
    {/* White wall outlet + small plug-in nightlight with yellow leaf sprig on top dado row */}
    <group position={[-.020, 1.24, -3.42]}>
      <Rounded at={[0, 0, 0]} size={[.012, .106, .066]} radius={.004} color="#efeee8" />
      <Cylinder at={[.014, -.006, 0]} height={.022} radius={.016} rotation={[0, 0, Math.PI / 2]} color="#f6f5ee" />
      <Rounded at={[.016, -.042, -.010]} size={[.008, .018, .020]} radius={.006} color="#c2b838" />
      <Rounded at={[.016, -.044, .010]} size={[.008, .016, .018]} radius={.006} color="#8ba63b" />
    </group>
  </RoomItem>
}

const tvCableA = new TubeGeometry(new CatmullRomCurve3([
  new Vector3(2.58, 1.16, -1.96), new Vector3(2.52, .92, -2.02), new Vector3(2.44, .74, -2.08), new Vector3(2.34, .94, -1.94),
]), 20, .0035, 6, false)

const tvCableB = new TubeGeometry(new CatmullRomCurve3([
  new Vector3(2.56, 1.14, -1.97), new Vector3(2.45, .86, -2.06), new Vector3(2.26, .96, -1.93),
]), 18, .003, 6, false)

function TvNicheKitchenSide({ woodFinish, onInspect }) {
  const grooves = Array.from({ length: 8 }, (_, i) => ({
    at: [2.14, 1.02 + i * .045, -1.918], size: [.74, .005, .006], color: '#1a1c1b',
  }))
  return <RoomItem id="kitchen-tv-back" onInspect={onInspect}>
    <RepeatMeshes pieces={dividerBackTrims} finish={woodFinish} shadow={false} />
    <Block at={[.45, .382, -2.055]} size={[.078, .056, .034]} color="#eeede7" finish={glazedWhite} />
    {/* Honey-wood picture-frame trim on the kitchen (-Z) face of the TV niche */}
    <Block at={[2.16, .89, -2.060]} size={[1.01, .048, .038]} color={honey} finish={woodFinish} />
    <Block at={[2.16, 1.49, -2.060]} size={[1.01, .048, .038]} color={honey} finish={woodFinish} />
    <Block at={[1.68, 1.19, -2.060]} size={[.048, .62, .038]} color={honey} finish={woodFinish} />
    <Block at={[2.64, 1.19, -2.060]} size={[.048, .62, .038]} color={honey} finish={woodFinish} />

    {/* Detailed rear casing of the TV facing the kitchen */}
    <Rounded at={[2.14, 1.16, -1.908]} size={[.72, .34, .028]} radius={.008} color="#282a29" finish={{ roughness: .42 }} />
    <RepeatMeshes pieces={grooves} shadow={false} />
    {/* Outlet inside niche left wood jamb & dangling cables */}
    <Rounded at={[2.605, 1.16, -1.97]} size={[.014, .068, .105]} radius={.003} color="#efeee8" />
    <Block at={[2.594, 1.16, -1.95]} size={[.016, .022, .026]} color="#202221" />
    <mesh geometry={tvCableA}><meshStandardMaterial color="#232524" roughness={.7} /></mesh>
    <mesh geometry={tvCableB}><meshStandardMaterial color="#292b2a" roughness={.7} /></mesh>

    {/* Mini green bonsai tree in stepped divider cubby #4 */}
    <group position={[2.20, 1.998, -1.985]}>
      <Cylinder at={[0, .018, 0]} height={.034} radius={.028} top={.036} color="#5c4234" />
      <Rod from={[0, .03, 0]} to={[.015, .095, 0]} radius={.006} taper={.5} color="#584331" />
      <RepeatMeshes pieces={Array.from({ length: 12 }, (_, i) => {
        const a = i * 1.1
        return {
          at: [Math.cos(a) * .034, .088 + (i % 3) * .018, Math.sin(a) * .026],
          size: [.034, .020, .022], rotation: [.2, a, 0], color: i % 2 ? '#3d6636' : '#537d44',
        }
      })} shadow={false} />
    </group>
  </RoomItem>
}

function ceilingSoffitWithHole(width, depth, holeRadius, thickness) {
  const outer = new Shape()
  outer.moveTo(-width / 2, -depth / 2)
  outer.lineTo(width / 2, -depth / 2)
  outer.lineTo(width / 2, depth / 2)
  outer.lineTo(-width / 2, depth / 2)
  outer.closePath()
  const hole = new Path()
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true)
  outer.holes.push(hole)
  return new ExtrudeGeometry(outer, { depth: thickness, bevelEnabled: false, curveSegments: 64 })
}

function annularRing(outerR, innerR, thickness) {
  const outer = new Shape()
  outer.absarc(0, 0, outerR, 0, Math.PI * 2, false)
  const hole = new Path()
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true)
  outer.holes.push(hole)
  return new ExtrudeGeometry(outer, { depth: thickness, bevelEnabled: false, curveSegments: 64 })
}

const outerCeilingGeo = ceilingSoffitWithHole(3.02, 4.32, 1.062, .012)
const greenRingGeo = annularRing(1.065, .728, .010)
const chandelierRingA = new TorusGeometry(.155, .009, 10, 40)
const chandelierRingB = new TorusGeometry(.135, .007, 10, 40)
const outerRimCylinder = new CylinderGeometry(1.060, 1.060, .054, 64, 1, true)
const innerRimCylinder = new CylinderGeometry(.730, .730, .038, 64, 1, true)

function KitchenCeiling({ onInspect }) {
  const cx = 1.45
  const cz = -4.18
  const downlights = Array.from({ length: 8 }, (_, i) => {
    const a = i * Math.PI / 4 + Math.PI / 8
    return [cx + Math.cos(a) * 1.24, 2.893, cz + Math.sin(a) * 1.48]
  })
  const globes = [
    [-.068, -.23, .042],
    [.072, -.28, .028],
    [.005, -.34, -.068],
  ]

  return <RoomItem id="kitchen-ceiling" onInspect={onInspect}>
    {/* Outer dropped white ceiling with circular cutout */}
    <mesh geometry={outerCeilingGeo} position={[cx, 2.895, cz]} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color="#f2f1ec" roughness={.86} />
    </mesh>
    {/* Outer vertical sage-green lip */}
    <mesh geometry={outerRimCylinder} position={[cx, 2.922, cz]}>
      <meshStandardMaterial color="#7d8f78" roughness={.78} side={DoubleSide} />
    </mesh>
    {/* Recessed mint-green circular ring */}
    <mesh geometry={greenRingGeo} position={[cx, 2.949, cz]} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color="#abbeab" roughness={.82} emissive="#9cb19c" emissiveIntensity={.03} />
    </mesh>
    {/* Inner vertical sage-green lip */}
    <mesh geometry={innerRimCylinder} position={[cx, 2.968, cz]}>
      <meshStandardMaterial color="#83957e" roughness={.78} side={DoubleSide} />
    </mesh>
    {/* Central white circular ceiling dome */}
    <Cylinder at={[cx, 2.990, cz]} height={.010} radius={.735} color="#eae9e3" shadow={false} />

    <Downlights points={downlights} radius={.038} />

    {/* Center gold & chrome ring chandelier with 3 crystal/glass globes */}
    <group position={[cx, 2.984, cz]}>
      <Cylinder at={[0, -.014, 0]} height={.026} radius={.115} color="#a9863e" finish={gold} />
      <mesh geometry={chandelierRingA} position={[0, -.11, 0]} rotation={[1.28, .25, .32]}>
        <meshStandardMaterial color="#8f9695" roughness={.16} metalness={.86} />
      </mesh>
      <mesh geometry={chandelierRingB} position={[0, -.13, 0]} rotation={[1.78, -.32, -.24]}>
        <meshStandardMaterial color="#ae8c42" {...gold} />
      </mesh>
      {globes.map(([gx, gy, gz], idx) => <group key={idx}>
        <Rod from={[gx * .7, -.02, gz * .7]} to={[gx, gy + .050, gz]} radius={.0022} color="#8e928f" shadow={false} />
        <Cylinder at={[gx, gy + .048, gz]} height={.018} radius={.014} color="#a9863e" finish={gold} />
        <mesh position={[gx, gy, gz]}>
          <sphereGeometry args={[.050, 20, 16]} />
          <meshPhysicalMaterial color="#d8d4c8" transparent opacity={.88} roughness={.22}
            clearcoat={.9} emissive="#e5d7b8" emissiveIntensity={.08} />
        </mesh>
      </group>)}
    </group>
  </RoomItem>
}

export function ReferenceKitchen({ surfaces, onInspect, active, bedroomActive }) {
  const darkWood = useMemo(() => ({ ...surfaces.redWood, roughness: .35, envMapIntensity: .46 }), [surfaces.redWood])
  const honeyWood = useMemo(() => ({ ...surfaces.redWood, roughness: .36, envMapIntensity: .72 }), [surfaces.redWood])
  const mintPlaster = useMemo(() => ({ ...surfaces.plaster }), [surfaces.plaster])

  const plasterWalls = [
    // -Z Stove & fridge wall (x = 0.62 to 2.95) + fridge-left corner pier (x = 0.555, z = -5.98..-6.16)
    { at: [1.785, 1.66, -6.39], size: [2.33, 2.62, .12], color: mint },
    { at: [.555, 1.66, -6.07], size: [.13, 2.62, .18], color: mint },
    { at: [.635, 1.66, -6.275], size: [.03, 2.62, .23], color: mint },
    // +X Upper & pier interior plaster lining
    { at: [2.935, 2.38, -5.81], size: [.024, 1.09, 1.06], color: mint },
    { at: [2.935, 2.76, -4.82], size: [.024, .33, .94], color: mint },
    { at: [2.935, 2.38, -3.91], size: [.024, 1.09, .90], color: mint },
    { at: [2.935, 2.76, -3.01], size: [.024, .33, .94], color: mint },
    { at: [2.935, 2.66, -2.29], size: [.024, .56, .52], color: mint },
    // -X Continuous bedroom spine wall upper mint-green plaster lining (y = 1.394 to 2.94)
    { at: [-.334, 2.167, -2.168], size: [.012, 1.546, .185], color: mint },
    { at: [-.334, 2.77, -2.71], size: [.012, .34, .94], color: mint },
    { at: [-.334, 2.167, -4.02], size: [.012, 1.546, 1.74], color: mint },
    { at: [-.334, 2.77, -5.33], size: [.012, .34, .94], color: mint },
    { at: [-.334, 2.167, -5.855], size: [.012, 1.546, .16], color: mint },
    { at: [-.410, 1.65, -5.928], size: [.152, 2.60, .016], color: mint },
  ]

  return <group>
    <RepeatMeshes pieces={floorTiles} finish={floorGlaze} shadow={false} />

    <RepeatMeshes pieces={plasterWalls} finish={mintPlaster} shadow={false} />
    <RepeatMeshes pieces={dadoTiles} finish={glazedWhite} shadow={false} />

    <KitchenCeiling onInspect={onInspect} />
    <KitchenSinkWindow woodFinish={darkWood} onInspect={onInspect} />
    <SideDoorway woodFinish={darkWood} onInspect={onInspect} />
    <LotusPainting onInspect={onInspect} />

    <RoomItem id="bedroom-doors" onInspect={onInspect}>
      <group position-x={-.30}><BedroomDoorUnit z={-2.71} leafAngle={-1.38} curtainRod finish={darkWood} /></group>
      <group position-x={-.30}><BedroomDoorUnit z={-5.33} leafAngle={-.52} talisman finish={darkWood} /></group>
    </RoomItem>
    {!bedroomActive && <group position-x={-.30}><SecondBedroomPocket /></group>}

    <group position-x={-.30}><DeerWallArtAndSconce onInspect={onInspect} /></group>
    <TvNicheKitchenSide woodFinish={honeyWood} onInspect={onInspect} />

    <KitchenCabinetry surfaces={surfaces} onInspect={onInspect} />
    <KitchenDining surfaces={surfaces} onInspect={onInspect} />
  </group>
}
