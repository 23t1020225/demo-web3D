import React, { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, DoubleSide, LatheGeometry, RepeatWrapping, TubeGeometry, Vector2, Vector3 } from 'three'
import { Block, Cylinder, Glass, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { paintedTexture } from './surfaces.js'
import { useRearDetailMaps, useRearMaterials } from './rear-materials.js'
import { RearDoorFace } from './rear-door-face.jsx'
import { rearCenter, rearDepth, rearDoorCenters, rearPlan, rearTimberZ, rearWidth, rearZ } from './rear-plan.js'

const floor = .354
const rearMint = '#c3d7c9'
const timber = '#3b1b14'
const timberPanel = '#4e2419'
const aluWhite = '#e7ecee'
const aluFrame = '#d8e0e3'
const groutTone = '#c9ccc1'
const chrome = { roughness: .34, metalness: .62, envMapIntensity: .40 }
const glazedWhite = { roughness: .38, envMapIntensity: .26 }
const porcelain = { roughness: .34, envMapIntensity: .30 }

// Real 60 cm floor courses, with edge tiles cut to the enlarged footprint.
const rearFloorTiles = []
for (let rz = 0; rz < 4; rz++) {
  const zTop = rearPlan.front + .13 - rz * .60
  const depth = Math.min(.60, zTop - rearPlan.back)
  if (depth <= 0) continue
  for (let cx = 0; cx < 6; cx++) {
    const xLeft = rearPlan.left + cx * .60
    const width = Math.min(.60, rearPlan.right - xLeft)
    if (width <= 0) continue
    rearFloorTiles.push({
      at: [xLeft + width / 2, .350, zTop - depth / 2],
      size: [width - .0015, .008, depth - .0015],
      color: ['#f9f9f6', '#f8f8f4', '#fbfaf7', '#f8f8f5'][(cx + rz) % 4],
    })
  }
}

function addTileWall(list, x0, z0, length, alongZ, bottom, top, cols, rows) {
  const w = length / cols
  const h = (top - bottom) / rows
  const shades = ['#fcfbf7', '#fafaf5', '#faf9f4', '#fdfcf8']
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const along = (c + .5) * w
      const y = bottom + (r + .5) * h
      list.push({
        at: alongZ ? [x0, y, z0 + along] : [x0 + along, y, z0],
        size: alongZ ? [.014, h - .0014, w - .0014] : [w - .0014, h - .0014, .014],
        color: shades[(r + c) % shades.length],
      })
    }
  }
}

const rearWallTiles = []
const tileGroutBackings = []
function tileFace(x, z, length, alongZ, bottom, top, cols, rows) {
  addTileWall(rearWallTiles, x, z, length, alongZ, bottom, top, cols, rows)
  const onLeft = alongZ && x < 0
  tileGroutBackings.push({
    at: alongZ ? [x + (onLeft ? -.008 : .008), (bottom + top) / 2, z + length / 2]
      : [x + length / 2, (bottom + top) / 2, z + (z < -7 ? -.008 : .008)],
    size: alongZ ? [.004, top - bottom, length] : [length, top - bottom, .004], color: groutTone,
  })
}

// Cabinet wall ends at the recessed, wider entrance.
tileFace(rearPlan.left, -5.958, 2.27, false, floor, 2.31, 4, 8)
const [leftDoorZ, rightDoorZ] = rearDoorCenters
const sidePiers = [
  [leftDoorZ + .33, rearPlan.front],
  [rightDoorZ + .31, leftDoorZ - .33],
  [rearPlan.back, rightDoorZ - .31],
]
for (const [start, end] of sidePiers) tileFace(rearPlan.left + .008, start, end - start, true, floor, 2.31, 1, 8)
tileFace(rearPlan.left + .008, rearPlan.back, rearDepth, true, 2.294, 2.33, 4, 1)

// Keep the real window opening and continuous horizontal grout lines.
for (let row = 0; row < 7; row++) {
  const bottom = floor + row * (2.05 - floor) / 7
  const top = floor + (row + 1) * (2.05 - floor) / 7
  for (let col = 0; col < 6; col++) {
    const left = rearPlan.left + col * .60, right = Math.min(rearPlan.right, left + .60)
    if (bottom >= 1.86 || top <= 1.10 || right <= -.47 || left >= .03) {
      tileFace(left, rearPlan.back + .008, right - left, false, bottom, top, 1, 1)
    } else {
      if (left < -.47) tileFace(left, rearPlan.back + .008, -.47 - left, false, bottom, top, 1, 1)
      if (right > .03) tileFace(.03, rearPlan.back + .008, right - .03, false, bottom, top, 1, 1)
      const a = Math.max(left, -.47), b = Math.min(right, .03)
      if (bottom < 1.10) tileFace(a, rearPlan.back + .008, b - a, false, bottom, 1.10, 1, 1)
      if (top > 1.86) tileFace(a, rearPlan.back + .008, b - a, false, 1.86, top, 1, 1)
    }
  }
}
tileFace(.492, rearPlan.back, rearTimberZ - .39 - rearPlan.back, true, floor, 2.05, 2, 7)
tileFace(.492, rearTimberZ + .39, rearPlan.front - rearTimberZ - .39, true, floor, 1.394, 1, 4)

const umbrellaHandle = new TubeGeometry(new CatmullRomCurve3([
  new Vector3(0, .72, 0), new Vector3(0, .80, 0), new Vector3(.018, .835, .012), new Vector3(.044, .815, .022),
]), 14, .007, 8, false)

const hoseCoil = new TubeGeometry(new CatmullRomCurve3(Array.from({ length: 241 }, (_, i) => {
  const angle = i / 240 * Math.PI * 6 + .18
  const radius = .105 + Math.sin(angle * 1.7) * .008
  return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 1.06, (i / 240 - .5) * .055 + Math.cos(angle * 2.2) * .006)
})), 300, .009, 10, false)
const foldedUmbrella = new LatheGeometry([
  [.003, .028], [.017, .09], [.032, .23], [.034, .39], [.024, .58], [.012, .68], [.006, .70],
].map(([x, y]) => new Vector2(x, y)), 48)
for (let i = 0; i < foldedUmbrella.attributes.position.count; i++) {
  const position = foldedUmbrella.attributes.position
  const x = position.getX(i), z = position.getZ(i), y = position.getY(i)
  const fold = 1 + Math.sin(Math.atan2(z, x) * 12 + y * 7) * .14
  position.setXYZ(i, x * fold, y, z * fold)
}
foldedUmbrella.computeVertexNormals()

const bowlShape = new LatheGeometry([
  [0, 0], [.032, 0], [.056, .026], [.062, .048], [.056, .048], [.028, .008], [0, .008],
].map(([r, y]) => new Vector2(r, y)), 18)

const wcBowl = new LatheGeometry([
  [.06, 0], [.12, .015], [.178, .091], [.224, .15], [.228, .17], [.208, .17], [.192, .142], [.155, .101], [.078, .066], [.027, .06], [0, .058],
].map(([x, y]) => new Vector2(x, y)), 28)

function RearBarredWindow({ onInspect, materials }) {
  const bars = [-.159, -.053, .053, .159].map(x => ({
    at: [x, 0, .024], size: [.012, .693, .014], color: '#e6e8e3',
  }))
  return <RoomItem id="rear-window" onInspect={onInspect}>
    <group position={[-.22, 1.48, rearPlan.back + .02]}>
      {/* Deep white tiled window reveal */}
      <Block at={[0, .375, -.043]} size={[.51, .016, .14]} color="#e7e8e1" finish={materials.tile} />
      <Block at={[0, -.375, -.033]} size={[.51, .020, .16]} color="#e4e5de" finish={materials.tile} />
      {[-.25, .25].map(x => <Block key={x} at={[x, 0, -.043]} size={[.016, .76, .14]} color="#eff0e9" finish={materials.tile} />)}
      {/* White aluminum frame */}
      {[-.35, .35].map(y => <Block key={y} at={[0, y, -.065]} size={[.46, .026, .040]} color={aluWhite} finish={chrome} />)}
      {[-.223, .223].map(x => <Block key={x} at={[x, 0, -.065]} size={[.023, .72, .040]} color={aluWhite} finish={chrome} />)}
      <Block at={[0, .29, -.058]} size={[.43, .018, .022]} color="#b4beb9" />
      {/* Bright natural daylight pane */}
      <mesh position={[0, 0, -.087]}>
        <planeGeometry args={[.43, .68]} />
        <meshBasicMaterial map={materials.daylight} color="#d6e3eb" />
      </mesh>
      <RepeatMeshes pieces={bars} finish={chrome} shadow={false} />
      <Rounded at={[-.196, -.29, -.025]} size={[.012, .055, .018]} radius={.003} color="#7a807c" finish={chrome} />
      <Rod from={[-.196, -.30, -.025]} to={[-.181, -.26, -.010]} radius={.005} color="#9b9c8d" finish={chrome} />
    </group>
    {/* Sunlit barred reflection patch on the glossy floor (Photo 1) */}
    <group position={[-.18, .3558, rearZ(-6.82)]}>
      {[-.11, -.04, .03, .10].map(x => <mesh key={x} position={[x, 0, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[.045, .42]} />
        <meshBasicMaterial color="#f5fbff" transparent opacity={.16} depthWrite={false} />
      </mesh>)}
    </group>
    {/* Soft barred daylight reflection on the +X glossy white wall tiles (Photo 3) */}
    <group position={[.483, 1.40, rearZ(-7.22)]} rotation-y={-Math.PI / 2}>
      {[-.045, -.015, .015, .045].map(x => <mesh key={x} position={[x, 0, 0]}>
        <planeGeometry args={[.018, .30]} />
        <meshBasicMaterial color="#f7fcff" transparent opacity={.10} depthWrite={false} />
      </mesh>)}
    </group>
  </RoomItem>
}

function photoPanel([left, top, right, bottom], width, height, pixelsHigh) {
  return [((left + right) / 1024 - .5) * width, (1 - (top + bottom) / (2 * pixelsHigh)) * height,
    (right - left) / 512 * width, (bottom - top) / pixelsHigh * height]
}
const timberLeafPanels = [
  [53, 70, 420, 270], [53, 1140, 420, 1325],
  [53, 339, 158, 444], [53, 476, 158, 919], [53, 958, 158, 1044],
  [312, 339, 418, 444], [312, 476, 418, 919], [312, 958, 418, 1044],
  [184, 339, 284, 608], [184, 642, 284, 755], [184, 795, 284, 1045],
].map(rect => photoPanel(rect, .76, 1.90, 1408))
const timberTransomPanels = [photoPanel([57, 70, 429, 242], .76, .43, 320)]

function ThirdBedroomDoor({ materials, onInspect }) {
  const w = .78
  const h = 2.40
  const casing = [
    ...[-1, 1].map(s => ({ at: [0, h / 2, s * (w / 2 + .026)], size: [.152, h + .03, .058], color: timber })),
    { at: [0, h + .005, 0], size: [.156, .068, w + .11], color: timber },
    { at: [0, 1.935, 0], size: [.150, .054, w + .03], color: timber },
    // Stepped molded architrave on -X lobby face
    ...[-1, 1].map(s => ({ at: [-.080, h / 2 + .01, s * (w / 2 + .038)], size: [.016, h + .06, .066], color: timberPanel })),
    { at: [-.082, h + .028, 0], size: [.020, .066, w + .14], color: timberPanel },
    { at: [-.079, 1.935, 0], size: [.014, .046, w + .02], color: timberPanel },
    ...[-1, 1].flatMap(s => [
      { at: [-.093, h / 2, s * .435], size: [.014, h + .10, .013], color: '#512a24' },
      { at: [-.096, h / 2, s * .411], size: [.010, h + .04, .010], color: '#261712' },
    ]),
  ]

  return <RoomItem id="rear-wood-door" onInspect={onInspect}>
    <group position={[.555, floor, rearTimberZ]}>
      {/* Black speckled granite threshold */}
      <Block at={[-.01, .0035, 0]} size={[.145, .007, w + .04]} color="#222527" finish={{ roughness: .22 }} />
      <RepeatMeshes pieces={casing} finish={materials.wood} />
      <Block at={[-.038, 2.17, 0]} size={[.060, .43, w - .02]} color={timber} finish={materials.wood} />
      <group position={[-.071, 1.95, 0]} rotation-y={-Math.PI / 2}>
        <RearDoorFace map={materials.transom} width={w - .02} height={.43} panels={timberTransomPanels} />
      </group>
      <Block at={[-.038, .965, 0]} size={[.045, 1.90, w - .02]} color={timber} finish={materials.wood} />
      <group position={[-.064, .015, 0]} rotation-y={-Math.PI / 2}>
        <RearDoorFace map={materials.doorLeaf} width={w - .02} height={1.90} panels={timberLeafPanels} />
      </group>
      {/* Brushed silver lever handle on vertical escutcheon (-Z left side) */}
      <Rounded at={[-.069, .794, -.342]} size={[.008, .19, .028]} radius={.003} color="#8d8773" finish={chrome} />
      <Rod from={[-.072, .806, -.342]} to={[-.102, .806, -.342]} radius={.007} color="#b3ad95" finish={chrome} />
      <Rod from={[-.102, .806, -.342]} to={[-.102, .806, -.23]} radius={.008} taper={.8} color="#c2bca6" finish={chrome} />
      {[.25, .95, 1.68].map(y => <Cylinder key={y} at={[-.012, y, .371]} height={.07} radius={.006} color="#75624c" finish={chrome} />)}
    </group>
    {/* Subtle mortar wear marks at bottom of tiles left of Door #3 (visible in Photo 3) */}
    <Block at={[.482, floor + .018, rearZ(-7.02)]} size={[.005, .032, .024]} color="#9d7f6c" shadow={false} />
    <Block at={[.482, floor + .012, rearZ(-7.12)]} size={[.005, .020, .022]} color="#9d7f6c" shadow={false} />
  </RoomItem>
}

function CornerUmbrellaAndHose({ details }) {
  return <group>
    {/* Closed green umbrella leaning INTO the +X / -Z corner (negative Z tilt so handle rests against +X wall) */}
    <group position={[.38, floor, rearPlan.back + .11]} rotation={[.06, 0, -.11]}>
      <Rod from={[0, 0, 0]} to={[0, .05, 0]} radius={.004} color="#252829" />
      <mesh geometry={foldedUmbrella} castShadow receiveShadow><meshStandardMaterial map={details.umbrella} roughness={.76} /></mesh>
      <Cylinder at={[0, .43, 0]} height={.025} radius={.035} top={.034} color="#b9d4b1" finish={{ roughness: .72 }} />
      <mesh geometry={umbrellaHandle}><meshStandardMaterial color="#181a1b" roughness={.35} /></mesh>
    </group>
    {/* Pale beige house slipper next to umbrella */}
    <Rounded at={[.30, floor + .010, rearPlan.back + .12]} size={[.19, .018, .085]} radius={.008} angle={.38} color="#cfc5b4" finish={{ roughness: .85 }} />
    <Rounded at={[.31, floor + .026, rearPlan.back + .12]} size={[.08, .022, .082]} radius={.010} angle={.38} color="#c4b9a6" finish={{ roughness: .85 }} />
    {/* Coiled purple hose / ring against back wall */}
    <group position={[.06, floor + .124, rearPlan.back + .09]} rotation={[.22, .08, -.13]}>
      <mesh geometry={hoseCoil} castShadow receiveShadow><meshStandardMaterial color="#5f437c" roughness={.76} bumpMap={details.fabric} bumpScale={.001} /></mesh>
    </group>
    {/* Small open cardboard box + folded grey cloth near left corridor corner (Photo 1) */}
    <group position={[-.46, floor, -6.28]} rotation-y={.28}>
      <Block at={[0, .006, 0]} size={[.22, .012, .18]} color="#85694a" />
      {[-.105, .105].map(x => <Block key={x} at={[x, .068, 0]} size={[.006, .135, .18]} color="#ac8a61" />)}
      {[-.087, .087].map(z => <Block key={z} at={[0, .068, z]} size={[.22, .135, .006]} color="#9e7b52" />)}
      <Block at={[-.12, .14, 0]} size={[.07, .005, .17]} rotation={[0, 0, .65]} color="#aa895f" />
      <Block at={[.09, .145, 0]} size={[.09, .006, .17]} rotation={[0, 0, -.55]} color="#ab875d" shadow={false} />
      <Rounded at={[.05, .018, .12]} size={[.14, .032, .10]} radius={.014} color="#8c8a82" finish={{ roughness: .92 }} />
    </group>
  </group>
}

function AluminumDishCabinet({ onInspect, materials }) {
  const miseTex = useMemo(() => paintedTexture(128, 96, ctx => {
    ctx.fillStyle = '#eeeade'
    ctx.fillRect(0, 0, 128, 96)
    ctx.fillStyle = '#75543a'
    ctx.font = 'bold 18px Arial'
    ctx.fillText('MISE', 38, 56)
  }), [])

  useEffect(() => () => miseTex.dispose(), [miseTex])

  const marble = { map: materials.marble, roughness: .44, envMapIntensity: .20 }
  const alu = { roughness: .42, metalness: .28, envMapIntensity: .36 }

  return <RoomItem id="dish-cabinet" onInspect={onInspect}>
    {/* Wall switch & double socket plates mounted clearly proud of +Z wall tiles */}
    <group position={[-1.02, 1.50, -5.974]}>
      <Rounded at={[0, 0, 0]} size={[.15, .092, .014]} radius={.004} color="#d8dad4" />
      <Rounded at={[0, 0, -.004]} size={[.138, .080, .010]} radius={.003} color="#f1f0ea" />
      <Block at={[.034, .005, -.010]} size={[.022, .038, .008]} color="#3c4042" />
      {[-.042, -.020].map(x => <Block key={x} at={[x, .012, -.010]} size={[.014, .022, .006]} color="#bcbdb6" />)}
    </group>
    <group position={[-1.98, 1.52, -5.974]}>
      <Rounded at={[0, 0, 0]} size={[.115, .082, .014]} radius={.004} color="#d8dad4" />
      <Rounded at={[0, 0, -.004]} size={[.104, .072, .010]} radius={.003} color="#f1f0ea" />
      {[-.024, .024].map(x => <Block key={x} at={[x, 0, -.010]} size={[.022, .036, .006]} color="#9fa39e" />)}
    </group>

    <group position={[-1.46, floor, -6.135]}>
      {/* 4 short yellow-gold leveling feet */}
      {[-.38, .38].flatMap(x => [-.135, .135].map(z =>
        <Cylinder key={`${x}:${z}`} at={[x, .018, z]} height={.036} radius={.014} color="#d49b2a" />
      ))}
      {/* Main rounded aluminum corner posts & frame */}
      {[-.40, .40].flatMap(x => [-.15, .15].map(z =>
        <Cylinder key={`p:${x}:${z}`} at={[x, .58, z]} height={1.09} radius={.016} color={aluWhite} finish={alu} />
      ))}
      {/* Top, middle & bottom shelves */}
      {[.042, .54, .82, 1.11].map(y =>
        <Rounded key={y} at={[0, y, 0]} size={[.81, .022, .31]} radius={.006} color={aluWhite} finish={alu} />
      )}
      {/* Top 3-sided aluminum gallery rail */}
      <Rod from={[-.40, 1.155, .148]} to={[.40, 1.155, .148]} radius={.006} color="#c5ccce" finish={chrome} />
      {[-.40, .40].map(x => <Rod key={x} from={[x, 1.155, -.148]} to={[x, 1.155, .148]} radius={.006} color="#c5ccce" finish={chrome} />)}

      {/* Back panel + lower marble-veined side & front twin doors */}
      <Block at={[0, .58, .152]} size={[.79, 1.06, .008]} color="#e8ecee" />
      <mesh position={[.404, .29, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[.28, .47]} />
        <meshStandardMaterial {...marble} />
      </mesh>
      <mesh position={[-.404, .29, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[.28, .47]} />
        <meshStandardMaterial {...marble} />
      </mesh>
      {[-.20, .20].map((x, idx) => <group key={x} position={[x, .29, -.152]}>
        <Rounded at={[0, 0, 0]} size={[.385, .47, .016]} radius={.005} color={aluWhite} finish={alu} />
        <mesh position={[0, 0, -.009]} rotation-y={Math.PI}>
          <planeGeometry args={[.33, .41]} />
          <meshStandardMaterial {...marble} />
        </mesh>
        <Rod from={[idx === 0 ? .145 : -.145, -.05, -.018]} to={[idx === 0 ? .145 : -.145, .06, -.018]} radius={.005} color="#b89d72" finish={chrome} />
      </group>)}

      {/* Rectified glass contents from photo 2, inside the real three-dimensional cabinet. */}
      <mesh position={[0, .825, -.145]} rotation-y={Math.PI}>
        <planeGeometry args={[.73, .49]} />
        <meshStandardMaterial map={materials.cabinetFront} roughness={.70} envMapIntensity={.08} />
      </mesh>
      <mesh position={[.397, .825, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[.275, .49]} />
        <meshStandardMaterial map={materials.cabinetSide} roughness={.70} envMapIntensity={.08} />
      </mesh>
      <group position={[.407, .825, 0]} rotation-y={Math.PI / 2}><Glass at={[0, 0, 0]} size={[.28, .53]} opacity={.08} /></group>
      {[-.20, .20].map((x, idx) => <group key={x} position={[x, .825, -.152]}>
        {[-.182, .182].map(sx => <Block key={sx} at={[sx, 0, 0]} size={[.030, .54, .016]} color={aluWhite} finish={alu} />)}
        {[-.255, .255].map(sy => <Block key={sy} at={[0, sy, 0]} size={[.385, .030, .016]} color={aluWhite} finish={alu} />)}
        <Glass at={[0, 0, -.010]} size={[.32, .48]} opacity={.07} />
        <Rod from={[idx === 0 ? .150 : -.150, -.05, -.018]} to={[idx === 0 ? .150 : -.150, .06, -.018]} radius={.005} color="#b89d72" finish={chrome} />
      </group>)}

      {/* Interior contents: stacked white ceramic bowls, OATS bag, blender jar & green box */}
      {[
        [.27, .05, 5], [.14, .04, 5], [.02, -.04, 3], [-.22, .02, 3],
      ].map(([bx, bz, count], sIdx) => <group key={sIdx} position={[bx, .555, bz]}>
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i} geometry={bowlShape} position={[0, i * .028, 0]}>
            <meshStandardMaterial color={i % 2 ? '#f4f4ef' : '#eaebe5'} {...porcelain} />
          </mesh>
        ))}
      </group>)}
      {/* Navy-blue OATS bag */}
      <group position={[.22, .92, .03]}>
        <Rounded at={[0, 0, 0]} size={[.13, .18, .07]} radius={.014} color="#1d325e" />
        <mesh position={[.067, 0, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[.066, .165]} />
          <meshStandardMaterial map={materials.oats} roughness={.68} />
        </mesh>
        <mesh position={[0, 0, -.036]} rotation-y={Math.PI}>
          <planeGeometry args={[.12, .165]} />
          <meshStandardMaterial map={materials.oats} roughness={.68} />
        </mesh>
      </group>
      {/* Blender pitcher & green box */}
      <Cylinder at={[.31, .92, .08]} height={.16} radius={.042} top={.048} color="#cfd6d8" finish={{ transparent: true, opacity: .48, roughness: .18 }} />
      <Cylinder at={[.31, .835, .08]} height={.026} radius={.045} color="#c59b6d" />
      <Rounded at={[.05, .87, -.04]} size={[.12, .08, .09]} radius={.008} color="#689e4b" />

      {/* Top of cabinet: water bottle, dark red vitamin jar & pink tray */}
      <Cylinder at={[-.02, 1.19, -.04]} height={.14} radius={.028} top={.016} color="#8fc4de" finish={{ transparent: true, opacity: .58, roughness: .15 }} />
      <Cylinder at={[.06, 1.16, .03]} height={.08} radius={.024} color="#6d1d22" />
      <Rounded at={[-.16, 1.138, -.02]} size={[.18, .032, .13]} radius={.006} color="#d8a89e" />
    </group>

    {/* Open brown cardboard carton filled with MISE tissue packs, green box, blue bag & red bottle */}
    <group position={[-.79, floor, -6.13]} rotation-y={-.08}>
      <Block at={[0, .008, 0]} size={[.34, .016, .28]} color="#8c6a43" />
      {[-.167, .167].map(x => <Block key={x} at={[x, .10, 0]} size={[.006, .20, .28]} color="#9e805b" />)}
      {[-.137, .137].map(z => <Block key={z} at={[0, .10, z]} size={[.34, .20, .006]} color="#8c6a43" />)}
      {[-1, 1].map(s => <Block key={s} at={[s * .175, .205, 0]} size={[.05, .006, .27]} rotation={[0, 0, -s * .45]} color="#9d784e" shadow={false} />)}
      {/* 3 white MISE tissue packs */}
      {[-.09, 0, .09].map(x => <group key={x} position={[x, .155, -.04]}>
        <Rounded at={[0, 0, 0]} size={[.082, .11, .14]} radius={.014} color="#ede9df" />
        <mesh position={[0, .056, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[.072, .11]} />
          <meshStandardMaterial map={miseTex} roughness={.55} />
        </mesh>
      </group>)}
      <Rounded at={[-.02, .225, .01]} size={[.16, .045, .07]} radius={.008} angle={.22} color="#76b843" />
      <Rounded at={[.05, .215, .08]} size={[.13, .07, .09]} radius={.024} color="#1a66c9" />
      <Cylinder at={[.12, .20, .09]} height={.11} radius={.032} color="#b82428" />
    </group>

    {/* Pink, blue & yellow laundry detergent pouch on floor between dish cabinet and left door */}
    <group position={[-2.41, floor, -6.28]} rotation-y={.35}>
      <Rounded at={[0, .075, 0]} size={[.16, .15, .12]} radius={.036} color="#dc3888" finish={{ roughness: .40 }} />
      <Rounded at={[0, .032, .01]} size={[.165, .055, .125]} radius={.022} color="#287cc9" finish={{ roughness: .40 }} />
      <Rounded at={[.01, .115, .02]} size={[.09, .04, .09]} radius={.014} color="#ecc832" finish={{ roughness: .40 }} />
    </group>
  </RoomItem>
}

function BathroomDoorsAndInterior({ onInspect, materials, details }) {
  // Alternating plain and four-petal cement tiles, rather than a diamond pattern.
  const wcFloorTex = useMemo(() => paintedTexture(512, 512, ctx => {
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        const cx = gx * 256 + 128, cy = gy * 256 + 128
        ctx.fillStyle = (gx + gy) % 2 ? '#d1d3c7' : '#66756e'
        ctx.fillRect(gx * 256, gy * 256, 256, 256)
        ctx.strokeStyle = '#939b90'; ctx.lineWidth = 2
        ctx.strokeRect(gx * 256 + 1, gy * 256 + 1, 254, 254)
        if ((gx + gy) % 2) continue
        ctx.strokeStyle = '#c4ccc0'; ctx.lineWidth = 3
        ctx.strokeRect(gx * 256 + 16, gy * 256 + 16, 224, 224)
        ctx.fillStyle = '#d5dbce'
        for (let petal = 0; petal < 4; petal++) {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(petal * Math.PI / 2)
          ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-64, -28, -49, -98, 0, -78)
          ctx.bezierCurveTo(49, -98, 64, -28, 0, 3); ctx.fill(); ctx.restore()
        }
        ctx.fillStyle = '#7a8880'; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fill()
      }
    }
  }), [])

  useEffect(() => {
    wcFloorTex.wrapS = wcFloorTex.wrapT = RepeatWrapping
    wcFloorTex.repeat.set(4, 4.5)
    wcFloorTex.needsUpdate = true
    return () => wcFloorTex.dispose()
  }, [wcFloorTex])

  const louverSlats = width => Array.from({ length: 33 }, (_, i) => ({
    at: [.011, 0, (-width / 2 + .012) + i * ((width - .024) / 32)],
    size: [.006, .58, .0025],
    color: '#c7cecd',
  }))

  return <>
    {/* Glowing 1.2m white batten T8 LED fluorescent tube mounted high above left aluminum door (Photo 4!) */}
    <RoomItem id="rear-tube-light" onInspect={onInspect}>
      <group position={[rearPlan.left + .032, 2.75, rearZ(-6.56)]}>
        <Block at={[0, 0, 0]} size={[.024, .036, 1.18]} color="#e6eaec" finish={{ roughness: .35, metalness: .25 }} />
        {[-.575, .575].map(z => <Block key={z} at={[.014, -.004, z]} size={[.028, .030, .024]} color="#484e52" />)}
        <Cylinder at={[.020, -.006, 0]} height={1.13} radius={.013} rotation={[Math.PI / 2, 0, 0]} color="#fbfeff"
          finish={{ emissive: '#fff1df', emissiveIntensity: .35, roughness: .42 }} shadow={false} />
      </group>
    </RoomItem>

    <RoomItem id="wc-doors" onInspect={onInspect}>
      {/* LEFT WHITE ALUMINUM DOOR (z = -6.43, width = 0.66m, CLOSED) */}
      <group position={[rearPlan.left, floor, leftDoorZ]}>
        <Block at={[0, .004, 0]} size={[.12, .008, .66]} color="#282c2e" />
        {[-.315, .315].map(z => <Block key={z} at={[0, .97, z]} size={[.09, 1.94, .036]} color={aluFrame} />)}
        <Block at={[0, 1.925, 0]} size={[.09, .038, .66]} color={aluFrame} />
        {/* Closed white aluminum sash */}
        <group position={[.012, 0, 0]}>
          {[-.28, .28].map(z => <Block key={z} at={[0, .955, z]} size={[.034, 1.89, .048]} color={aluWhite} />)}
          {[.03, .65, 1.42, 1.88].map(y => <Block key={y} at={[0, y, 0]} size={[.034, .042, .56]} color={aluWhite} finish={glazedWhite} />)}
          {/* Lower vertical-ribbed white aluminum panel */}
          <Block at={[0, .34, 0]} size={[.018, .58, .52]} color="#edf1f2" />
          <group position={[.002, .34, 0]}><RepeatMeshes pieces={louverSlats(.52)} shadow={false} /></group>
          {/* Middle brick-textured frosted privacy film */}
          <mesh position={[.019, 1.035, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[.52, .72]} />
            <meshStandardMaterial map={materials.brick} roughness={.72} envMapIntensity={.10} />
          </mesh>
          {/* Upper dark-backed diamond privacy glass */}
          <mesh position={[.018, 1.65, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[.52, .41]} />
            <meshStandardMaterial map={materials.diamond} roughness={.48} envMapIntensity={.18} />
          </mesh>
        </group>
      </group>

      {/* RIGHT WHITE ALUMINUM DOOR (z = -7.19, width = 0.62m, OPEN INWARD at -58° into WC) */}
      <group position={[rearPlan.left, floor, rightDoorZ]}>
        <Block at={[0, .004, 0]} size={[.12, .008, .62]} color="#282c2e" />
        {[-.295, .295].map(z => <Block key={z} at={[0, .97, z]} size={[.09, 1.94, .036]} color={aluFrame} />)}
        <Block at={[0, 1.925, 0]} size={[.09, .038, .62]} color={aluFrame} />
        {/* 3 silver hinges on -Z right jamb */}
        {[.28, .96, 1.64].map(y => <Cylinder key={y} at={[-.015, y, -.275]} height={.065} radius={.007} color="#9aa2a4" finish={chrome} />)}
        {/* Inward-swung white aluminum door leaf (negative rotation-y swings -X inside WC!) */}
        <group position={[-.02, 0, -.275]} rotation-y={-1.02}>
          <group position={[0, 0, .275]}>
            {[-.26, .26].map(z => <Block key={z} at={[0, .95, z]} size={[.032, 1.88, .045]} color={aluWhite} />)}
            {[.03, .65, 1.87].map(y => <Block key={y} at={[0, y, 0]} size={[.032, .046, .52]} color={aluWhite} />)}
            <Block at={[0, .34, 0]} size={[.016, .58, .48]} color="#e2e8ea" />
            <group position={[.002, .34, 0]}><RepeatMeshes pieces={louverSlats(.48)} shadow={false} /></group>
            <mesh position={[.006, 1.26, 0]} rotation-y={Math.PI / 2}>
              <planeGeometry args={[.48, 1.16]} />
              <meshStandardMaterial color="#64776e" transparent opacity={.92} roughness={.49} side={DoubleSide} envMapIntensity={.15} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Angled dark-grey rectangular bathmat & burgundy oval fluffy bathmat */}
      <group position={[-2.28, floor + .005, rearZ(-6.44)]} rotation-y={-.20}>
        <Rounded at={[0, .003, 0]} size={[.43, .016, .57]} radius={.008} color="#5b5a51" finish={{ roughness: .97, bumpMap: details.fabric, bumpScale: .003 }} />
        <Block at={[-.11, .006, .16]} size={[.036, .003, .028]} color="#1e201f" shadow={false} />
        <Block at={[-.11, .007, .16]} size={[.016, .003, .012]} color="#e5e6e2" shadow={false} />
      </group>
      <mesh position={[-2.31, floor + .010, rearZ(-7.20)]} rotation-y={.16} scale={[.78, 1, 1.1]} receiveShadow castShadow>
        <cylinderGeometry args={[.21, .205, .014, 64]} />
        <meshStandardMaterial color="#64172a" roughness={.98} bumpMap={details.fabric} bumpScale={.004} />
      </mesh>
    </RoomItem>

    {/* WC / BATHROOM INTERIOR BEHIND -X PARTITION (x = -3.84..-2.36, z = -5.95..-7.56) */}
    <group>
      <mesh position={[-3.225, .351, rearCenter[1]]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[1.23, rearDepth]} />
        <meshStandardMaterial map={wcFloorTex} roughness={.45} />
      </mesh>
      {/* Interior tiled walls + checkered border accent strip visible through open WC door */}
      <Block at={[-3.835, 1.56, rearCenter[1]]} size={[.02, 2.42, rearDepth]} color="#bcc4c2" finish={glazedWhite} />
      <Block at={[-3.225, 1.56, rearPlan.back + .012]} size={[1.23, 2.42, .02]} color="#b8c0be" finish={glazedWhite} />
      <Block at={[-3.225, 1.56, -5.965]} size={[1.23, 2.42, .02]} color="#b8c0be" finish={glazedWhite} />
      <Block at={[-3.225, 2.95, rearCenter[1]]} size={[1.25, .02, rearDepth]} color="#cfd4d2" shadow={false} />
      {/* Dark glossy tiled water cistern / counter & checkered tile border seen on left inside open WC door (Photo 2!) */}
      <Block at={[-3.13, .76, rearZ(-6.72)]} size={[.88, .80, .46]} color="#141819" finish={{ roughness: .18, envMapIntensity: .75 }} />
      <RepeatMeshes pieces={Array.from({ length: 12 }, (_, i) => ({
        at: [-3.62 + i * .085, 1.24, -6.955], size: [.042, .042, .008], color: i % 2 ? '#252b2a' : '#eaeeec',
      }))} shadow={false} />
      <RepeatMeshes pieces={Array.from({ length: 10 }, (_, i) => ({
        at: [-3.82, 1.24, -7.50 + i * .085], size: [.008, .042, .042], color: i % 2 ? '#252b2a' : '#eaeeec',
      }))} shadow={false} />

      <RoomItem id="basin" onInspect={onInspect}>
        <Rounded at={[-3.48, .92, -6.22]} size={[.42, .05, .42]} radius={.012} color="#eceae2" finish={porcelain} />
        <mesh geometry={wcBowl} position={[-3.44, .94, -6.22]} scale={[.85, .75, .85]}>
          <meshStandardMaterial color="#f2f0e8" {...porcelain} />
        </mesh>
        <Rod from={[-3.62, .95, -6.22]} to={[-3.62, 1.13, -6.22]} radius={.014} color="#c2c9c8" finish={chrome} />
        <Rod from={[-3.62, 1.13, -6.22]} to={[-3.51, 1.13, -6.22]} radius={.013} color="#c2c9c8" finish={chrome} />
        <Rounded at={[-3.81, 1.58, -6.22]} size={[.024, .58, .42]} radius={.014} color="#9aa6a2" finish={chrome} />
      </RoomItem>

      <group position-z={-.30}><RoomItem id="toilet" onInspect={onInspect}>
        <Rounded at={[-3.64, .92, -7.42]} size={[.18, .39, .30]} radius={.036} color="#eeece4" finish={porcelain} />
        <Rounded at={[-3.42, .50, -7.42]} size={[.34, .28, .24]} radius={.048} color="#eeece4" finish={porcelain} />
        <mesh geometry={wcBowl} position={[-3.38, .62, -7.42]} rotation-y={Math.PI / 2} scale={[.82, .62, 1.04]}>
          <meshStandardMaterial color="#f2f0e8" {...porcelain} />
        </mesh>
      </RoomItem></group>

      <group position-z={-.15}><RoomItem id="shower" onInspect={onInspect}>
        <Rod from={[-3.80, 1.08, -6.78]} to={[-3.80, 2.08, -6.78]} radius={.012} color="#bcc5c4" finish={chrome} />
        <Rod from={[-3.80, 2.08, -6.78]} to={[-3.56, 2.08, -6.78]} radius={.012} color="#bcc5c4" finish={chrome} />
        <Cylinder at={[-3.56, 2.06, -6.78]} height={.026} radius={.085} color="#c2cbca" finish={chrome} />
      </RoomItem></group>
    </group>
  </>
}

export function ReferenceRearSection({ surfaces, onInspect, active }) {
  const materials = useRearMaterials()
  const details = useRearDetailMaps()
  const mintPlaster = useMemo(() => ({ normalMap: surfaces.plaster.normalMap, normalScale: new Vector2(.025, .025), roughness: .94 }), [surfaces.plaster])

  const upperPlaster = [
    { at: [-1.475, 2.635, -5.955], size: [2.27, .65, .016], color: rearMint },
    { at: [rearPlan.left + .01, 2.645, rearCenter[1]], size: [.016, .63, rearDepth], color: rearMint },
    { at: [rearCenter[0], 2.505, rearPlan.back + .01], size: [rearWidth, .91, .016], color: rearMint },
    { at: [.490, 2.505, (rearPlan.back + rearTimberZ - .39) / 2], size: [.016, .91, rearTimberZ - .39 - rearPlan.back], color: rearMint },
    { at: [.490, 2.88, rearTimberZ], size: [.016, .16, .82], color: rearMint },
    { at: [.490, 2.177, (rearTimberZ + .39 + rearPlan.front) / 2], size: [.016, 1.566, rearPlan.front - rearTimberZ - .39], color: rearMint },
  ]

  return <group>
    <Block at={[rearCenter[0], .3455, rearCenter[1] + .065]} size={[rearWidth, .002, rearDepth + .13]} color="#b8b9b2" shadow={false} />
    <RepeatMeshes pieces={rearFloorTiles} finish={materials.floor} shadow={false} />
    <Block at={[rearCenter[0], 2.96, rearCenter[1] + .20]} size={[rearWidth + .08, .016, rearDepth + .40]} color="#eff0e9" finish={{ roughness: .96 }} shadow={false} />

    <RepeatMeshes pieces={upperPlaster} finish={mintPlaster} shadow={false} />
    <RepeatMeshes pieces={tileGroutBackings} shadow={false} />
    <RepeatMeshes pieces={rearWallTiles} finish={materials.tile} shadow={false} />

    {[[-1.46, -6.14, .95, .47], [.08, rearPlan.back + .13, .46, .24], [-.79, -6.13, .46, .40]].map(([x, z, w, d]) => <mesh key={`${x}:${z}`} position={[x, .357, z]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[w, d]} /><meshBasicMaterial map={details.contact} transparent depthWrite={false} />
    </mesh>)}
    <RearBarredWindow onInspect={onInspect} materials={materials} />
    <ThirdBedroomDoor materials={materials} onInspect={onInspect} />
    <CornerUmbrellaAndHose details={details} />
    <AluminumDishCabinet onInspect={onInspect} materials={materials} />
    <BathroomDoorsAndInterior onInspect={onInspect} materials={materials} details={details} />
  </group>
}
