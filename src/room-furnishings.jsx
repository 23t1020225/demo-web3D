import React, { useEffect, useMemo } from 'react'
import { DoubleSide, RepeatWrapping, TorusGeometry } from 'three'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { paintedTexture } from './surfaces.js'

const floor = .354
const chrome = { roughness: .25, metalness: .74, envMapIntensity: .8 }
const walnut = '#c09873'
const oak = '#b98245'
const oakLight = '#c68f52'
const oakDark = '#9d6a33'
const hardware = '#ad9c83'
const bedroomMint = '#9bc3b7'
const bedroomDado = '#d5dcd9'
const greenCageRing = new TorusGeometry(.192, .006, 8, 32)
const greyCageRing = new TorusGeometry(.146, .005, 8, 28)

const bedroomFloorTiles = []
for (let rz = 0; rz < 7; rz++) {
  for (let cx = 0; cx < 6; cx++) {
    bedroomFloorTiles.push({
      at: [-3.85 + (cx + .5) * .612, .3505, -5.84 + (rz + .5) * .538],
      size: [.608, .008, .534],
      color: ['#b3bbbd', '#aeb6b8', '#b7bfc1', '#abb3b6'][(cx + rz) % 4],
    })
  }
}

const bedroomUpperWalls = [
  { at: [-2.02, 2.177, -2.078], size: [3.68, 1.566, .014], color: bedroomMint },
  { at: [-2.17, 2.177, -5.845], size: [3.38, 1.566, .014], color: bedroomMint },
  { at: [-3.845, 2.177, -4.61], size: [.014, 1.566, 2.46], color: bedroomMint },
  { at: [-3.845, 2.177, -2.20], size: [.014, 1.566, .24], color: bedroomMint },
  { at: [-3.845, 2.58, -2.85], size: [.014, .76, 1.06], color: bedroomMint },
  { at: [-.492, 2.177, -2.19], size: [.012, 1.566, .23], color: bedroomMint },
  { at: [-.492, 2.177, -4.02], size: [.012, 1.566, 1.82], color: bedroomMint },
  { at: [-.492, 2.177, -5.79], size: [.012, 1.566, .12], color: bedroomMint },
]

const bedroomDadoWalls = [
  { at: [-2.02, .874, -2.076], size: [3.68, 1.04, .016], color: bedroomDado },
  { at: [-2.17, .874, -5.843], size: [3.38, 1.04, .016], color: bedroomDado },
  { at: [-3.843, .874, -4.61], size: [.016, 1.04, 2.46], color: bedroomDado },
  { at: [-3.843, .874, -2.20], size: [.016, 1.04, .24], color: bedroomDado },
  { at: [-3.843, .657, -2.85], size: [.016, .606, 1.06], color: bedroomDado },
  { at: [-.490, .874, -2.19], size: [.014, 1.04, .23], color: bedroomDado },
  { at: [-.490, .874, -4.02], size: [.014, 1.04, 1.82], color: bedroomDado },
  { at: [-.490, .874, -5.79], size: [.014, 1.04, .12], color: bedroomDado },
]

const bedSlats = Array.from({ length: 16 }, (_, i) => ({
  at: [-2.61 + i * .101, .704, -2.54],
  size: [.086, .016, .84],
  color: i % 2 ? oakLight : oak,
}))

export function RoomItem({ id, onInspect, children }) {
  return <group onClick={onInspect ? event => {
    if (event.delta > 5) return
    event.stopPropagation()
    onInspect(id)
  } : undefined}>{children}</group>
}

function BedroomWindow({ woodFinish }) {
  const bars = [
    ...Array.from({ length: 6 }, (_, i) => ({ at: [0, -.48 + i * .19, .25], size: [.014, .014, .48], color: '#4a4e46' })),
    ...[.11, .25, .39].map(z => ({ at: [0, 0, z], size: [.014, 1.14, .014], color: '#4a4e46' })),
  ]
  return <group position={[-3.825, 1.58, -2.85]}>
    {/* Outer dark wooden window frame (z = -3.37 to -2.33) */}
    <Block at={[0, .60, 0]} size={[.05, .06, 1.06]} color="#53271c" finish={woodFinish} />
    <Block at={[0, -.60, 0]} size={[.05, .06, 1.06]} color="#53271c" finish={woodFinish} />
    {[-.50, 0, .50].map(z => <Block key={z} at={[0, 0, z]} size={[.05, 1.24, .055]} color="#53271c" finish={woodFinish} />)}
    {/* +Z half open to bright sunlit garden & iron security bars */}
    <mesh position={[.012, 0, .25]} rotation-y={Math.PI / 2}>
      <planeGeometry args={[.46, 1.12]} />
      <meshBasicMaterial color="#f6fae8" toneMapped={false} />
    </mesh>
    <group position={[.024, 0, 0]}><RepeatMeshes pieces={bars} shadow={false} /></group>
    <Block at={[.042, .34, .36]} size={[.020, .48, .24]} color="#97cae2"
      finish={{ transparent: true, opacity: .76, roughness: .6 }} shadow={false} />
    {/* -Z half closed dark-mahogany wooden shutter leaf */}
    <Rounded at={[.016, 0, -.25]} size={[.036, 1.12, .45]} radius={.005} color="#4b2218" finish={woodFinish} />
    <Rounded at={[.032, .26, -.25]} size={[.014, .42, .33]} radius={.004} color="#5d2c20" finish={woodFinish} />
    <Rounded at={[.032, -.26, -.25]} size={[.014, .42, .33]} radius={.004} color="#5d2c20" finish={woodFinish} />
  </group>
}

function GreenStandFan() {
  return <group position={[-1.16, floor, -2.70]} rotation-y={.36}>
    {/* Glossy round black base */}
    <Cylinder at={[0, .017, 0]} height={.034} radius={.175} top={.155} color="#111314" finish={{ roughness: .14, metalness: .20 }} />
    <Cylinder at={[0, .036, 0]} height={.012} radius={.048} color="#202325" />
    {/* Black stand column & motor housing */}
    <Rod from={[0, .036, 0]} to={[0, .68, 0]} radius={.017} color="#171a1b" />
    <Cylinder at={[-.045, .71, 0]} height={.11} radius={.046} rotation={[0, 0, Math.PI / 2]} color="#1b1f1d" />
    {/* Circular dark moss-green fan guard cage & radial blades */}
    <group position={[.025, .71, 0]} rotation-y={Math.PI / 2}>
      <mesh geometry={greenCageRing}><meshStandardMaterial color="#255224" roughness={.36} /></mesh>
      <Cylinder at={[0, 0, 0]} height={.052} radius={.190} rotation={[Math.PI / 2, 0, 0]} color="#2f632d"
        finish={{ transparent: true, opacity: .48, roughness: .42, side: DoubleSide }} />
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = i * Math.PI / 6
        return <Rod key={i} from={[-Math.cos(a) * .188, -Math.sin(a) * .188, .024]}
          to={[Math.cos(a) * .188, Math.sin(a) * .188, .024]} radius={.002} color="#254e24" shadow={false} />
      })}
      {[0, 2.094, 4.189].map(a => <group key={a} rotation-z={a}>
        <Rounded at={[.082, 0, -.004]} size={[.115, .052, .008]} radius={.014} color="#214820" />
      </group>)}
      <Cylinder at={[0, 0, .028]} height={.010} radius={.042} rotation={[Math.PI / 2, 0, 0]} color="#141615" />
    </group>
  </group>
}

export function Bedroom({ surfaces, onInspect }) {
  const oakFinish = {
    normalMap: surfaces.wood.normalMap,
    normalScale: surfaces.wood.normalScale,
    roughness: .34,
    envMapIntensity: .46,
  }
  const darkWood = { ...surfaces.redWood, roughness: .38, envMapIntensity: .45 }

  const laceValance = useMemo(() => {
    const tex = paintedTexture(512, 192, ctx => {
      const g = ctx.createLinearGradient(0, 0, 0, 192)
      g.addColorStop(0, '#6ba9cf')
      g.addColorStop(.50, '#82bce0')
      g.addColorStop(.58, '#a7d4ee')
      g.addColorStop(1, '#75b2d7')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 512, 192)
      for (let x = 0; x < 512; x += 14) {
        ctx.fillStyle = x % 28 === 0 ? 'rgba(245,252,255,.28)' : 'rgba(42,88,120,.22)'
        ctx.fillRect(x, 0, 6, 192)
      }
      ctx.strokeStyle = 'rgba(235,248,255,.68)'
      ctx.lineWidth = 2.4
      for (const yBand of [42, 98, 168]) {
        ctx.beginPath()
        for (let x = 0; x <= 512; x += 24) {
          ctx.arc(x + 12, yBand, 12, 0, Math.PI, false)
        }
        ctx.stroke()
      }
    })
    tex.wrapS = RepeatWrapping
    tex.repeat.set(3, 1)
    tex.needsUpdate = true
    return tex
  }, [])
  useEffect(() => () => laceValance.dispose(), [laceValance])

  return <group>
    <RepeatMeshes pieces={bedroomFloorTiles} finish={{ roughness: .34, envMapIntensity: .30 }} shadow={false} />
    <RepeatMeshes pieces={bedroomUpperWalls} finish={surfaces.plaster} shadow={false} />
    <RepeatMeshes pieces={bedroomDadoWalls} finish={{ roughness: .35, envMapIntensity: .32 }} shadow={false} />
    <BedroomWindow woodFinish={darkWood} />

    <RoomItem id="bed" onInspect={onInspect}>
      {/* Honey-oak slatted wooden platform bed (giường phản nan gỗ sồi) */}
      {[-2.68, -1.04].flatMap(x => [-2.96, -2.12].map(z =>
        <Rounded key={`${x}:${z}`} at={[x, .528, z]} size={[.076, .348, .076]} radius={.008} color={oak} finish={oakFinish} />
      ))}
      {/* Box-style side & foot aprons with recessed kick cutout */}
      <Rounded at={[-1.86, .585, -2.965]} size={[1.62, .21, .036]} radius={.006} color={oak} finish={oakFinish} />
      <Rounded at={[-1.86, .585, -2.115]} size={[1.62, .21, .036]} radius={.006} color={oak} finish={oakFinish} />
      <Rounded at={[-1.04, .585, -2.54]} size={[.038, .21, .85]} radius={.006} color={oak} finish={oakFinish} />
      <Block at={[-1.86, .445, -2.94]} size={[1.44, .09, .028]} color={oakDark} finish={oakFinish} />
      <Block at={[-1.06, .445, -2.54]} size={[.028, .09, .68]} color={oakDark} finish={oakFinish} />
      {/* Dark under-deck & grooved honey-oak slats */}
      <Block at={[-1.86, .690, -2.54]} size={[1.64, .016, .85]} color="#45301d" shadow={false} />
      <RepeatMeshes pieces={bedSlats} finish={oakFinish} />
      {/* Honey-oak 2-panel headboard */}
      <Rounded at={[-2.685, .92, -2.54]} size={[.052, .46, .89]} radius={.010} color={oak} finish={oakFinish} />
      <Rounded at={[-2.685, 1.14, -2.54]} size={[.064, .046, .91]} radius={.008} color={oakLight} finish={oakFinish} />
      {[-2.75, -2.33].map(z => <Rounded key={z} at={[-2.655, .91, z]} size={[.018, .30, .35]} radius={.006} color={oakDark} finish={oakFinish} />)}
      {/* Tall dark-mahogany wooden wardrobe/shutter vertical edge behind right side of headboard */}
      <Rounded at={[-2.82, 1.38, -3.14]} size={[.24, 2.04, .32]} radius={.008} color="#2e1610" finish={darkWood} />

      {/* Folded navy/white blanket & small green pillow */}
      <Rounded at={[-2.06, .742, -2.32]} size={[.38, .058, .34]} radius={.024} color="#24334f" finish={surfaces.fabric} />
      <Rounded at={[-2.01, .774, -2.34]} size={[.25, .020, .24]} radius={.010} color="#e2e6ec" finish={surfaces.fabric} />
      <Rounded at={[-1.24, .748, -2.82]} size={[.18, .072, .22]} radius={.034} color="#587b33" finish={surfaces.fabric} />

      {/* Light-blue lace rectangular mosquito net (mùng khung xếp màu xanh dương nhạt có diềm ren) */}
      <Block at={[-1.87, 2.04, -2.54]} size={[1.70, .006, .90]} color="#7dbbe0"
        finish={{ transparent: true, opacity: .66, roughness: .72 }} shadow={false} />
      <mesh position={[-1.87, 1.91, -2.99]}>
        <planeGeometry args={[1.70, .26]} />
        <meshStandardMaterial map={laceValance} transparent opacity={.90} roughness={.66} side={DoubleSide} />
      </mesh>
      <mesh position={[-1.02, 1.91, -2.54]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[.90, .26]} />
        <meshStandardMaterial map={laceValance} transparent opacity={.90} roughness={.66} side={DoubleSide} />
      </mesh>
      <mesh position={[-2.72, 1.91, -2.54]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[.90, .26]} />
        <meshStandardMaterial map={laceValance} transparent opacity={.86} roughness={.66} side={DoubleSide} />
      </mesh>
      {/* Soft fanned sheer blue tulle pleats & hang cords */}
      {[-2.70, -1.03].flatMap(x => [-2.98, -2.10].map(z => (
        <Rod key={`c:${x}:${z}`} from={[x, 2.04, z]} to={[x, 2.32, z]} radius={.0025} color="#a6cee4" shadow={false} />
      )))}
      {[-.18, -.09, 0, .09, .18].map((dx, idx) => (
        <Rod key={idx} from={[-2.42 + dx * 1.4, 1.82, -2.26 - idx * .05]} to={[-2.66 + dx * .25, 1.06, -2.10]}
          radius={.042} taper={.48} color={idx % 2 ? '#7ab7dc' : '#8ec4e4'}
          finish={{ transparent: true, opacity: .44, roughness: .82 }} shadow={false} />
      ))}

      <GreenStandFan />
    </RoomItem>

    <group position-x={-.30}><RoomItem id="wardrobe" onInspect={onInspect}>
      {/* Tall dark-brown wardrobe tucked in +Z front corner inside Door 1 (hidden in Photo 6, revealed in Photo 7) */}
      <group position={[-.35, floor, -2.138]}>
        <Rounded at={[0, .88, 0]} size={[.28, 1.76, .105]} radius={.010} color="#43281b" finish={darkWood} />
        <Rounded at={[0, .89, -.054]} size={[.24, 1.66, .012]} radius={.006} color="#523222" finish={darkWood} />
        <Block at={[0, .022, -.004]} size={[.30, .044, .118]} color="#5f3b29" finish={darkWood} />
        {/* Kraft cardboard box "933" on top of wardrobe */}
        <Rounded at={[.01, 1.88, -.004]} size={[.25, .24, .102]} radius={.006} color="#917047" finish={{ roughness: .86 }} />
        <Block at={[.01, 1.91, -.056]} size={[.05, .020, .004]} color="#3b2d1f" shadow={false} />
      </group>
      {/* Round dark-blue biscuit tin with red rim on floor in front of wardrobe */}
      <group position={[-.31, floor, -2.155]}>
        <Cylinder at={[0, .050, 0]} height={.100} radius={.056} color="#192c54" finish={{ roughness: .28, metalness: .35 }} />
        <Cylinder at={[0, .018, 0]} height={.024} radius={.057} color="#ab2b28" finish={{ roughness: .32, metalness: .3 }} />
        <Cylinder at={[0, .101, 0]} height={.006} radius={.058} color="#c5cacd" finish={chrome} />
      </group>
      {/* Grey-cage stand fan with radial bright orange rotor blades */}
      <group position={[-.31, floor, -2.155]} rotation-y={-.18}>
        <Rod from={[0, .02, 0]} to={[0, .62, 0]} radius={.012} color="#55595c" />
        <group position={[0, .66, -.016]}>
          <mesh geometry={greyCageRing}><meshStandardMaterial color="#9aa1a4" {...chrome} /></mesh>
          <Cylinder at={[0, 0, 0]} height={.040} radius={.142} rotation={[Math.PI / 2, 0, 0]} color="#7f8689"
            finish={{ transparent: true, opacity: .14, roughness: .38, side: DoubleSide }} />
          {[0, 1, 2, 3, 4, 5].map(i => {
            const a = i * Math.PI / 6
            return <Rod key={i} from={[-Math.cos(a) * .140, -Math.sin(a) * .140, -.018]}
              to={[Math.cos(a) * .140, Math.sin(a) * .140, -.018]} radius={.0018} color="#adb4b7" shadow={false} />
          })}
          {[0, 2.094, 4.189].map(a => <group key={a} rotation-z={a}>
            <Rounded at={[.062, 0, .004]} size={[.088, .042, .010]} radius={.012} color="#f25820"
              finish={{ emissive: '#d84512', emissiveIntensity: .14, roughness: .32 }} />
          </group>)}
          <Cylinder at={[0, 0, -.020]} height={.008} radius={.032} rotation={[Math.PI / 2, 0, 0]} color="#34383b" />
        </group>
      </group>
    </RoomItem></group>

    <RoomItem id="bedside" onInspect={onInspect}>
      <Rounded at={[-1.45, .59, -4.35]} size={[.48, .47, .46]} radius={.020} color={walnut} finish={oakFinish} />
      <Rounded at={[-1.45, .66, -4.11]} size={[.42, .17, .028]} radius={.008} color="#b39173" finish={oakFinish} />
      <Rod from={[-1.50, .66, -4.085]} to={[-1.40, .66, -4.085]} radius={.009} color={hardware} finish={chrome} />
      <Cylinder at={[-1.45, .84, -4.35]} height={.028} radius={.085} color="#9c8468" />
      <Cylinder at={[-1.45, .97, -4.35]} height={.24} radius={.024} color="#a19075" />
      <Cylinder at={[-1.45, 1.10, -4.35]} height={.18} radius={.13} top={.088} color="#e1ccaa" finish={surfaces.fabric} />
    </RoomItem>
  </group>
}
