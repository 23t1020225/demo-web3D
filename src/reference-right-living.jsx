import React, { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, LatheGeometry, Path, Shape, TubeGeometry, Vector2, Vector3 } from 'three'
import { CarvedLivingSet } from './carved-living-set.jsx'
import { Block, Cylinder, RepeatMeshes, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { paintedTexture } from './surfaces.js'

const mint = '#d4ddc9'
const ivory = '#e9e7e0'
const honey = '#c48a51'
const timber = '#66372b'
const iron = '#34352f'
const brass = '#a88648'
const lacquer = { roughness: .38, envMapIntensity: .45 }
const glazedTile = { roughness: .35, envMapIntensity: .32 }
const steel = { roughness: .43, metalness: .45 }
const diffuser = { roughness: .34, emissive: '#fff1df', emissiveIntensity: .16 }
const cylinder = new CylinderGeometry(1, 1, 1, 20)

const sideWall = [
  [.35, 1.02, -1.98, 1.61],
  [1.02, 2.59, -1.98, -1.11],
  [1.02, 2.59, .91, 1.61],
  [2.59, 2.97, -1.98, 1.61],
].map(([bottom, top, start, end]) => ({
  at: [2.937, (bottom + top) / 2, (start + end) / 2], size: [.029, top - bottom, end - start], color: mint,
}))

const wainscot = Array.from({ length: 24 }, (_, i) => ({
  at: [2.915, .35 + (Math.floor(i / 6) + .5) * .171, -1.98 + (i % 6 + .5) * .598],
  size: [.023, .169, .595], color: ['#e5e3dc', '#e9e7e0', '#e6e4dd'][i % 3],
}))

const floorTiles = Array.from({ length: 30 }, (_, i) => ({
  at: [-.03 + (i % 5 + .5) * .594, .350, -1.94 + (Math.floor(i / 5) + .5) * .585],
  size: [.591, .008, .582], color: ['#d6d7d3', '#d4d5d2', '#dadad7', '#d8d8d4'][(i + Math.floor(i / 5)) % 4],
}))

function bar(x1, y1, x2, y2, color = iron, width = .027) {
  return x1 === x2
    ? { at: [x1, (y1 + y2) / 2, .047], size: [width, Math.abs(y2 - y1) + width, .027], color }
    : { at: [(x1 + x2) / 2, y1, .047], size: [Math.abs(x2 - x1) + width, width, .027], color }
}

const grille = [
  ...[-.732, -.596, .349, .461].map(y => bar(-.953, y, .953, y)),
  ...[-.953, -.580, -.108, .108, .580, .953].map(x => bar(x, -.732, x, .461)),
  ...[-1, 1].flatMap(s => [
    bar(s * .75, -.596, s * .75, .135),
    bar(s * .315, -.410, s * .315, .349),
    bar(s * .450, -.596, s * .450, .112),
    ...[-.408, -.226, -.045, .137].map(y => bar(s * .95, y, s * .75, y)),
    ...[-.410, -.219, -.025, .112].map(y => bar(s * .580, y, s * .315, y)),
    ...[-.532, -.321, -.117, .087, .279].map(y => bar(s * .108, y, s * .315, y)),
    bar(s * .953, .232, s * .580, .232),
  ]),
]

export function ReferenceGrilleWindow({ finish, at, angle, scale }) {
  const frame = [
    ...[-.985, .985].map(x => ({ at: [x, 0, 0], size: [.09, 1.61, .174], color: timber })),
    ...[-.770, .482, .772].map(y => ({ at: [0, y, 0], size: [2.06, .067, .174], color: timber })),
  ]
  return <group position={at} rotation-y={angle} scale={scale}>
    <RepeatMeshes pieces={frame} finish={finish} />
    {[-.765, 0, .765].map((x, i) => <group key={x} position={[x, .623, 0]}>
      <Rounded at={[0, 0, 0]} size={[i === 1 ? 1.094 : .426, .246, .125]} radius={.011} color={timber} finish={finish} />
      <Rounded at={[0, 0, .064]} size={[i === 1 ? .987 : .335, .162, .020]} radius={.007} color="#784736" finish={finish} />
    </group>)}
    <RepeatMeshes pieces={grille} finish={steel} shadow={false} />
    <Rounded at={[0, -.818, .042]} size={[2.11, .042, .213]} radius={.007} color="#837367" finish={{ roughness: .38 }} />
  </group>
}

const dividerColumns = [
  [.45, .96, .76, [1.43, 2.17]],
  [.96, 1.46, 1.15, [1.80, 2.41]],
  [1.46, 1.96, 1.53, [2.22]],
  [1.96, 2.47, 1.97, [2.47]],
  [2.47, 2.94, 2.38, []],
]
const niche = { left: 1.68, right: 2.64, bottom: .89, top: 1.49 }

const slats = dividerColumns.flatMap(([left, right, top], col) =>
  Array.from({ length: 9 }, (_, i) => {
    const width = (right - left) / 9
    const x = left + (i + .5) * width
    const ranges = x > niche.left && x < niche.right
      ? [[.377, niche.bottom], [niche.top, top]]
      : [[.377, top]]
    return ranges.filter(([lo, hi]) => hi > lo + .015).map(([lo, hi]) => ({
      at: [x, (lo + hi) / 2, -1.997], size: [width - .0016, hi - lo, .098],
      color: ['#c38a50', '#ca9159', '#bc8047', '#c68c4e', '#b98048'][(i * 3 + col) % 5],
    }))
  }).flat())

const dividers = [
  { at: [1.695, .384, -1.995], size: [2.56, .054, .155], color: '#b5804d' },
  { at: [1.455, 2.917, -2.005], size: [2.99, .117, .195], color: honey },
  { at: [-.012, 1.655, -2.004], size: [.056, 2.45, .142], color: honey },
  ...[.45, .96, 1.46, 1.96, 2.47, 2.94].flatMap(x => {
    const ranges = x > niche.left && x < niche.right ? [[.41, niche.bottom], [niche.top, 2.88]] : [[.41, 2.88]]
    return ranges.map(([lo, hi]) => ({ at: [x, (lo + hi) / 2, -1.987], size: [.075, hi - lo, .153], color: honey }))
  }),
  ...dividerColumns.flatMap(([left, right, top, shelves]) => [top, ...shelves].map(y => ({
    at: [(left + right) / 2, y, -1.981], size: [right - left, .054, .164], color: '#c18c54',
  }))),
  ...[niche.left, niche.right].map(x => ({ at: [x, 1.19, -1.955], size: [.055, .611, .151], color: '#a77345' })),
  ...[niche.bottom, niche.top].map(y => ({ at: [2.16, y, -1.937], size: [1.01, .052, .240], color: honey })),
]

export function Downlights({ points, radius = .038 }) {
  return <>
    <RepeatMeshes geometry={cylinder} pieces={points.map(at => ({ at, size: [radius, .011, radius], color: '#c2bdb3' }))} finish={steel} shadow={false} />
    <RepeatMeshes geometry={cylinder} pieces={points.map(([x, y, z]) => ({
      at: [x, y - .006, z], size: [radius * .78, .004, radius * .78], color: '#f5f2e8',
    }))} finish={diffuser} shadow={false} />
  </>
}

function Divider({ finish, onInspect }) {
  const screen = useMemo(() => paintedTexture(512, 288, ctx => {
    const wash = ctx.createLinearGradient(0, 280, 512, 0)
    wash.addColorStop(0, '#181819')
    wash.addColorStop(.66, '#171719')
    wash.addColorStop(1, '#333638')
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, 512, 288)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = 'rgba(188,201,198,.12)'
      ctx.fillRect(389 + (i % 3) * 29, 13 + Math.floor(i / 3) * 57, 23, 50)
    }
  }), [])
  useEffect(() => () => screen.dispose(), [screen])

  return <>
    <RoomItem id="wood-divider" onInspect={onInspect}>
      <RepeatMeshes pieces={slats} finish={finish} />
      <RepeatMeshes pieces={dividers} finish={finish} />
      {/* White ceramic plinth & floor doorstops at base of wall-side wood post */}
      <Block at={[-.012, .392, -2.004]} size={[.062, .084, .148]} color="#eeede7" finish={glazedTile} />
      <Cylinder at={[.016, .365, -2.055]} height={.020} radius={.011} rotation={[0, 0, Math.PI / 2]} color="#f5f4ee" />
      <Cylinder at={[-.012, .366, -1.922]} height={.016} radius={.009} rotation={[Math.PI / 2, 0, 0]} color="#252728" />
      <Downlights points={[.11, .31, .70, 1.21, 1.71, 2.21, 2.71].map(x => [x, 2.853, -1.995])} radius={.027} />
    </RoomItem>
    <RoomItem id="media" onInspect={onInspect}>
      <Rounded at={[2.16, 1.175, -1.892]} size={[.877, .501, .047]} radius={.007} color="#222221" finish={{ roughness: .29 }} />
      <Block at={[2.16, 1.177, -1.867]} size={[.851, .473, .005]} color="#f0ede6"
        finish={{ map: screen, roughness: .17, metalness: .12, envMapIntensity: .55 }} shadow={false} />
      {[-1, 1].map(side => <Block key={side} at={[2.16 + side * .305, .928, -1.874]} size={[.104, .018, .10]} color="#343433" angle={side * .37} />)}
      <Rounded at={[2.12, .921, -1.807]} size={[.155, .018, .074]} radius={.004} color="#e1ded2" />
    </RoomItem>
  </>
}

function AirCooler() {
  const vents = [
    ...Array.from({ length: 12 }, (_, i) => ({ at: [-.162 + i * .0295, .348, .153], size: [.007, .360, .013], color: '#aaa99e' })),
    ...Array.from({ length: 12 }, (_, i) => ({ at: [0, .175 + i * .0315, .156], size: [.342, .006, .013], color: '#c3c1b7' })),
  ]
  return <group position={[2.701, .354, -1.59]} rotation-y={-.12}>
    <Rounded at={[0, .367, 0]} size={[.451, .679, .297]} radius={.029} color="#e1e0d6" finish={{ roughness: .34 }} />
    <Rounded at={[0, .685, .006]} size={[.455, .071, .298]} radius={.012} color="#333432" />
    <Block at={[0, .351, .147]} size={[.354, .370, .008]} color="#383c39" />
    <RepeatMeshes pieces={vents} finish={{ roughness: .42 }} shadow={false} />
    <Rounded at={[0, .115, .151]} size={[.286, .044, .010]} radius={.004} color="#b6bab3" />
    <RepeatMeshes pieces={[-.108, -.066, -.024, .018, .060, .102].map((x, i) => ({
      at: [x, .722, .059], size: [.022, .004, .012], color: i === 0 ? '#739d85' : '#c1c0b7',
    }))} shadow={false} />
    {[-.159, .159].map(x => <Block key={x} at={[x, .025, 0]} size={[.049, .05, .218]} color="#555850" />)}
  </group>
}

function Clock({ finish }) {
  const dial = useMemo(() => paintedTexture(256, 256, ctx => {
    ctx.fillStyle = '#eee1be'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#392f21'
    ctx.font = '23px Georgia'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let n = 1; n <= 12; n++) {
      const a = n * Math.PI / 6
      ctx.fillText(n, 128 + Math.sin(a) * 95, 128 - Math.cos(a) * 95)
    }
    ctx.strokeStyle = '#42392a'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(81, 91)
    ctx.lineTo(128, 128)
    ctx.lineTo(164, 75)
    ctx.stroke()
  }), [])
  useEffect(() => () => dial.dispose(), [dial])
  return <group position={[-.030, 2.07, -1.598]} rotation-y={Math.PI / 2}>
    <Rounded at={[0, 0, 0]} size={[.204, .473, .066]} radius={.015} color="#623525" finish={finish} />
    <Rounded at={[0, .233, .012]} size={[.225, .063, .074]} radius={.023} color="#713e2b" finish={finish} />
    <Rounded at={[0, -.225, .015]} size={[.216, .045, .074]} radius={.012} color="#713e2b" finish={finish} />
    <Rounded at={[0, -.087, .035]} size={[.122, .208, .008]} radius={.006} color="#33382d" />
    <Block at={[0, -.091, .042]} size={[.007, .139, .009]} color={brass} finish={steel} />
    <Cylinder at={[0, -.141, .046]} height={.009} radius={.025} color="#ba975d" finish={steel} rotation={[Math.PI / 2, 0, 0]} />
    <Cylinder at={[0, .119, .045]} height={.017} radius={.077} color={brass} finish={steel} rotation={[Math.PI / 2, 0, 0]} />
    <mesh position={[0, .119, .054]}>
      <circleGeometry args={[.067, 32]} /><meshStandardMaterial map={dial} roughness={.46} />
    </mesh>
  </group>
}

function OpenWall({ plaster }) {
  const wallPaint = { ...plaster, map: null, normalMap: null, roughnessMap: null, roughness: .86 }
  // Glossy white ceramic dado tiles along the +X face of OpenWall (under Clock & stepped sills)
  const clockWallTiles = []
  for (let r = 0; r < 4; r++) {
    const y = .354 + (r + .5) * .26
    for (let c = 0; c < 4; c++) {
      const z = -1.94 + (c + .5) * .39
      if (z > -.65 && y > 1.01) continue
      clockWallTiles.push({
        at: [.004, y, z], size: [.014, .256, .386],
        color: ['#eeede7', '#f2f1ec', '#eae9e3'][(r + c) % 3],
      })
    }
  }
  return <>
    <Block at={[-.113, 1.649, -1.675]} size={[.22, 2.60, .548]} color="#cbd5c2" finish={wallPaint} shadow={false} />
    <RepeatMeshes pieces={clockWallTiles} finish={glazedTile} shadow={false} />
    {[[.37, 1.01, 1.90], [-.319, 1.43, 2.36], [-1.01, 1.83, 2.84]].map(([z, sill, top]) => <group key={z}>
      <Block at={[-.113, (.35 + sill) / 2, z - .33]} size={[.22, sill - .35, .673]} color="#cbd5c2" finish={wallPaint} />
      <Block at={[-.113, sill + .009, z - .33]} size={[.25, .023, .690]} color="#454a40" finish={{ roughness: .22, envMapIntensity: .45 }} />
      <Block at={[-.113, (.35 + top - .067) / 2, z]} size={[.237, top - .35 - .067, .235]} color="#cbd5c2" finish={wallPaint} />
      <Rounded at={[-.113, top - .060, z]} size={[.277, .040, .275]} radius={.004} color="#aab79a" finish={wallPaint} />
      <Rounded at={[-.113, top - .023, z]} size={[.315, .037, .313]} radius={.004} color="#b5c2a4" finish={wallPaint} />
      <Rounded at={[-.113, top + .015, z]} size={[.353, .041, .350]} radius={.003} color="#b8c5a8" finish={wallPaint} />
    </group>)}
    {/* Small folded dark/red cloth tucked on the lowest stepped sill */}
    <group position={[.006, 1.028, .35]}>
      <Rounded at={[0, 0, 0]} size={[.075, .048, .12]} radius={.020} angle={.25} color="#282a2c" finish={{ roughness: .88 }} />
      <Rounded at={[.018, -.022, .01]} size={[.055, .042, .085]} radius={.016} angle={-.2} color="#9e3232" finish={{ roughness: .86 }} />
    </group>
    {/* Front interior wall dado tiles, switch plate, security camera & gold talisman + tube light above MainDoor */}
    <RepeatMeshes pieces={[
      { at: [2.586, 1.66, 1.600], size: [1.028, 2.62, .018], color: '#cdd6c5' },
      { at: [1.10, 2.82, 1.600], size: [1.944, .50, .018], color: '#cdd6c5' },
    ]} finish={wallPaint} shadow={false} />
    <RepeatMeshes pieces={Array.from({ length: 8 }, (_, i) => ({
      at: [2.329 + (i % 2) * .514, .354 + (Math.floor(i / 2) + .5) * .24, 1.586],
      size: [.511, .237, .015], color: i % 3 ? '#e7e4dc' : '#e4e1d9',
    }))} finish={glazedTile} shadow={false} />
    <Rounded at={[2.46, 1.41, 1.570]} size={[.32, .092, .012]} radius={.003} color="#e1e2d8" />
    <RepeatMeshes pieces={[-.105, 0, .105].flatMap(dx => [
      { at: [2.46 + dx, 1.41, 1.561], size: [.083, .073, .007], color: '#efeee5' },
      ...[-.013, .013].map(x => ({ at: [2.46 + dx + x, 1.417, 1.556], size: [.006, .019, .003], color: '#72776d' })),
    ])} shadow={false} />
    <Block at={[.045, .87, 1.598]} size={[.24, 1.04, .016]} color="#eeede7" finish={glazedTile} />
    <Rounded at={[.045, 1.24, 1.586]} size={[.10, .068, .010]} radius={.003} color="#f3f2ec" />
    <Block at={[.86, 2.75, 1.588]} size={[.078, .125, .006]} color="#dcb642" shadow={false} />
    <Block at={[.88, 2.63, 1.584]} size={[.72, .020, .018]} color="#f2f3ec"
      finish={{ emissive: '#fff1df', emissiveIntensity: .18 }} shadow={false} />
    <group position={[.035, 2.48, 1.585]}>
      <Cylinder at={[0, 0, -.018]} height={.036} radius={.018} rotation={[Math.PI / 2, 0, 0]} color="#f0f1ed" />
      <Cylinder at={[0, -.012, -.036]} height={.022} radius={.014} color="#25282a" />
    </group>
  </>
}

const ceilingCenter = [1.42, 2.874, -.197]

export function rectangularRing(width, depth, innerWidth, innerDepth, thickness) {
  const outside = new Shape()
  const inside = new Path()
  for (const [path, x, y] of [[outside, width / 2, depth / 2], [inside, innerWidth / 2, innerDepth / 2]]) {
    path.moveTo(-x, -y)
    path.lineTo(x, -y)
    path.lineTo(x, y)
    path.lineTo(-x, y)
    path.closePath()
  }
  outside.holes.push(inside)
  return new ExtrudeGeometry(outside, { depth: thickness, bevelEnabled: false })
}

const outerSoffit = rectangularRing(3.11, 3.68, 2.64, 3.18, .075)
const mintRecess = rectangularRing(2.646, 3.186, 2.19, 2.68, .043)
const rim = rectangularRing(2.203, 2.693, 2.145, 2.635, .037)
const islandOutline = new Shape()
islandOutline.moveTo(-.81, -1.02)
islandOutline.lineTo(.81, -1.02)
islandOutline.lineTo(.81, 1.02)
islandOutline.lineTo(-.81, 1.02)
islandOutline.closePath()
const inset = new Path()
inset.absarc(0, 0, .474, 0, 2 * Math.PI, true)
islandOutline.holes.push(inset)
const island = new ExtrudeGeometry(islandOutline, { depth: .06, bevelEnabled: false, curveSegments: 32 })
const ceilingRose = new LatheGeometry([
  [0, .066], [.22, .065], [.34, .058], [.41, .042], [.46, .018], [.478, .004], [.496, 0],
].map(([r, y]) => new Vector2(r, y)), 48)

function curvedArm(points, radius) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(point => new Vector3(...point))), 22, radius, 7, false)
}

const armOuter = curvedArm([[.034, -.275, 0], [.137, -.316, 0], [.234, -.263, 0], [.259, -.165, 0], [.332, -.143, 0], [.397, -.144, 0]], .0078)
const armInner = curvedArm([[.03, -.267, 0], [.104, -.281, 0], [.185, -.221, 0], [.164, -.141, 0], [.217, -.103, 0]], .0065)
const shade = new LatheGeometry([
  [.012, 0], [.021, .008], [.029, .025], [.040, .053], [.043, .070],
  [.043, .073], [.039, .073], [.036, .054], [.025, .026], [.016, .012], [.012, .007],
].map(([r, y]) => new Vector2(r, y)), 20)

const longAngles = Array.from({ length: 8 }, (_, i) => i * Math.PI / 4)
const shortAngles = Array.from({ length: 4 }, (_, i) => i * Math.PI / 2 + Math.PI / 8)
const lampPositions = [[longAngles, .399, -.145, 1.14], [shortAngles, .217, -.101, .93]].flatMap(([angles, distance, y, scale]) =>
  angles.map(a => ({ at: [Math.cos(a) * distance, y, -Math.sin(a) * distance], rotation: [0, a, -.98], scale })))

function Chandelier() {
  const dark = { roughness: .37, metalness: .34 }
  return <group position={ceilingCenter}>
    <Cylinder at={[0, .047, 0]} radius={.049} height={.028} color="#33322e" finish={dark} />
    <Cylinder at={[0, -.094, 0]} radius={.011} height={.263} color="#292926" finish={dark} />
    <Cylinder at={[0, -.242, 0]} radius={.057} top={.046} height={.072} color="#363531" finish={dark} />
    <Cylinder at={[0, -.287, 0]} radius={.019} top={.032} height={.031} color={brass} finish={steel} />
    <RepeatMeshes geometry={armOuter} pieces={longAngles.map(a => ({ at: [0, 0, 0], rotation: [0, a, 0], color: '#292a26' }))} finish={dark} />
    <RepeatMeshes geometry={armInner} pieces={shortAngles.map(a => ({ at: [0, 0, 0], rotation: [0, a, 0], color: '#33332d' }))} finish={dark} />
    <RepeatMeshes geometry={shade} pieces={lampPositions.map(({ at, rotation, scale }) => ({
      at, rotation, size: [scale, scale, scale], color: '#f3eee4',
    }))} finish={{ roughness: .34, emissive: '#e9dfc8', emissiveIntensity: .12 }} />
    <RepeatMeshes geometry={cylinder} pieces={lampPositions.map(({ at, rotation }) => ({
      at, rotation, size: [.014, .026, .014], color: '#b79557',
    }))} finish={steel} />
  </group>
}

function Ceiling({ onInspect }) {
  const [x, y, z] = ceilingCenter
  const layers = [
    [outerSoffit, 2.898, '#f0eee6'], [mintRecess, 2.931, '#c7d3bc'],
    [rim, 2.928, '#acbc9b'], [island, y, '#efeee9'],
  ]
  const downlights = [
    ...[-1.37, 1.37].flatMap(dx => [-1.11, .08, 1.19].map(dz => [x + dx, 2.896, z + dz])),
    ...[-1.63, 1.63].flatMap(dz => [-.81, 0, .81].map(dx => [x + dx, 2.896, z + dz])),
    ...[-.57, .57].flatMap(dx => [-.78, .78].map(dz => [x + dx, y - .003, z + dz])),
  ]
  return <>
    {layers.map(([geometry, height, color]) => <mesh key={height} geometry={geometry} position={[x, height, z]} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color={color} roughness={.87} />
    </mesh>)}
    <Block at={[x, 2.958, z]} size={[2.22, .024, 2.71]} color="#e9e9e3" shadow={false} />
    <mesh geometry={ceilingRose} position={[x, y - .002, z]} receiveShadow>
      <meshStandardMaterial color="#f1f0eb" roughness={.86} side={DoubleSide} />
    </mesh>
    <Downlights points={downlights} />
    <RoomItem id="chandelier" onInspect={onInspect}><Chandelier /></RoomItem>
  </>
}

function EntranceMat() {
  const weave = useMemo(() => paintedTexture(256, 256, ctx => {
    ctx.fillStyle = '#b9a280'; ctx.fillRect(0, 0, 256, 256)
    for (let r = 122; r > 3; r -= 5) {
      ctx.strokeStyle = r % 3 ? '#8c7757' : '#d2bb96'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(128, 128, r, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.globalAlpha = .28
    ctx.strokeStyle = '#e5d8b9'; ctx.lineWidth = 1
    for (let y = 0; y < 256; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y + 13); ctx.stroke() }
  }), [])
  useEffect(() => () => weave.dispose(), [weave])
  return <mesh position={[1.51, .359, 1.23]} rotation-x={-Math.PI / 2} scale={[.365, .235, 1]} receiveShadow>
    <circleGeometry args={[1, 48]} />
    <meshStandardMaterial map={weave} color="#c7b392" roughness={.96} />
  </mesh>
}

export function ReferenceRightLiving({ surfaces, onInspect, onDividerInspect }) {
  const furniture = useMemo(() => ({ ...surfaces.redWood, ...lacquer }), [surfaces.redWood])
  const divider = useMemo(() => ({ ...surfaces.redWood, ...lacquer, roughness: .36 }), [surfaces.redWood])
  return <>
    <RepeatMeshes pieces={floorTiles} finish={glazedTile} shadow={false} />
    <RepeatMeshes pieces={sideWall} finish={surfaces.plaster} shadow={false} />
    <RepeatMeshes pieces={wainscot} finish={glazedTile} shadow={false} />
    <RoomItem id="right-window" onInspect={onInspect}><ReferenceGrilleWindow at={[2.98, 1.805, -.10]} angle={-Math.PI / 2} finish={divider} /></RoomItem>
    <RoomItem id="left-divider" onInspect={onDividerInspect}><OpenWall plaster={surfaces.plaster} /></RoomItem>
    <RoomItem id="wall-clock" onInspect={onInspect}><Clock finish={furniture} /></RoomItem>
    <Divider finish={divider} onInspect={onInspect} />
    <RoomItem id="air-cooler" onInspect={onInspect}><AirCooler /></RoomItem>
    <Ceiling onInspect={onInspect} />
    <EntranceMat />
    <CarvedLivingSet finish={furniture} onInspect={onInspect} />
  </>
}
