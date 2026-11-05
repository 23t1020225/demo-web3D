import React, { useEffect, useMemo } from 'react'
import { CylinderGeometry, DoubleSide, ExtrudeGeometry, PlaneGeometry, QuadraticBezierCurve3, RepeatWrapping, Shape, SphereGeometry, TubeGeometry, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { Rail, Ridge, RoofPlane } from './roof.jsx'
import { paintedTexture, randomFrom } from './surfaces.js'

const fenceColors = ['#aeada4', '#b7b4a8', '#b0aea5', '#b9b6ad', '#a9a89f', '#b1aea4']
const metal = '#b6beb9'
const pillar = '#b1afa0'
const zFence = 6.56
const leftPier = 1.89
const rightPier = 5.77
const boltHead = new CylinderGeometry(.5, .5, 1, 6).rotateX(Math.PI / 2)
const fencePost = new RoundedBoxGeometry(.218, 1.58, .232, 2, .006)
const fenceCap = new RoundedBoxGeometry(.309, .074, .323, 2, .007)
const fenceFinial = new SphereGeometry(.096, 24, 16)
const picket = new ExtrudeGeometry(new Shape().moveTo(-.5, -.5).lineTo(.5, -.5).lineTo(.5, .385).lineTo(-.25, .5).lineTo(-.5, .453).closePath(), { depth: 1, bevelEnabled: false }).translate(0, 0, -.5)
const picketPositions = picket.getAttribute('position')
const picketNormals = picket.getAttribute('normal')
const picketUVs = picket.getAttribute('uv')
for (let i = 0; i < picketPositions.count; i++) {
  const horizontal = Math.abs(picketNormals.getY(i)) > .6
  const front = Math.abs(picketNormals.getZ(i)) > .6
  const u = horizontal || front ? picketPositions.getX(i) : picketPositions.getZ(i)
  const v = horizontal ? picketPositions.getZ(i) : picketPositions.getY(i)
  picketUVs.setXY(i, u + .5, v + .5)
}
function shrubLeaf(length, across) {
  const geometry = new PlaneGeometry(1, 1, length, across).rotateX(-Math.PI / 2)
  const point = geometry.attributes.position
  for (let index = 0; index < point.count; index++) {
    const x = point.getX(index)
    const width = Math.max(.016, Math.cos(x * Math.PI))
    point.setXYZ(index, x, .117 * width - Math.abs(point.getZ(index)) * .15, point.getZ(index) * width)
  }
  geometry.computeVertexNormals()
  return geometry
}
const leaf = shrubLeaf(3, 2)
const distantLeaf = shrubLeaf(2, 1)

function mottling(ctx, random, count, palette) {
  const { width, height } = ctx.canvas
  for (let index = 0; index < count; index++) {
    const x = random() * width
    const y = random() * height
    const radius = 3 + random() ** 2 * width * .11
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, palette[index % palette.length])
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
}

function concretePatina(base, seed, footing = false) {
  return paintedTexture(footing ? 768 : 384, footing ? 256 : 768, ctx => {
    const { width, height } = ctx.canvas
    const random = randomFrom(seed)
    ctx.fillStyle = '#e4e0d7'
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = .76
    ctx.drawImage(base, 0, 0, width, height)
    ctx.globalAlpha = 1
    mottling(ctx, random, 96, ['rgba(76,72,61,.14)', 'rgba(146,144,125,.11)', 'rgba(247,242,228,.30)'])

    // The damp line varies across the surface. Streaks run down from the cap.
    for (let x = 0; x < width; x += 2) {
      const start = height * (footing ? .13 : .54) + Math.sin(x * .021) * height * .085 + Math.sin(x * .088) * height * .027
      const darken = ctx.createLinearGradient(0, start, 0, height)
      darken.addColorStop(0, 'rgba(55,57,48,0)')
      darken.addColorStop(.44, 'rgba(69,70,53,.20)')
      darken.addColorStop(1, `rgba(48,50,41,${.52 + random() * .20})`)
      ctx.fillStyle = darken
      ctx.fillRect(x, start, 2, height - start)
    }
    for (let i = 0; i < 58; i++) {
      const x = random() * width
      const start = random() ** 3 * height * .73
      const end = start + height * (.04 + random() ** 2 * .53)
      const streak = ctx.createLinearGradient(x, start, x, end)
      streak.addColorStop(0, 'rgba(51,54,44,0)')
      streak.addColorStop(.28, `rgba(58,60,47,${.04 + random() * .15})`)
      streak.addColorStop(1, 'rgba(51,54,44,0)')
      ctx.fillStyle = streak
      ctx.fillRect(x, start, 1 + random() ** 2 * 9, end - start)
    }
    for (let i = 0; i < 3100; i++) {
      const x = random() * width
      const y = random() * height
      const grain = .3 + random() ** 3 * (footing ? 4 : 2.6)
      ctx.fillStyle = i % 2 ? `rgba(48,47,43,${.07 + random() * .24})` : `rgba(240,234,218,${.05 + random() * .30})`
      ctx.fillRect(x, y, grain, grain * (.45 + random() * .68))
    }
  })
}

function useYardFinishes(surfaces) {
  const maps = useMemo(() => {
    const base = surfaces.plaster.map.image
    const zinc = paintedTexture(256, 512, ctx => {
      const random = randomFrom(2501)
      ctx.fillStyle = '#f0f1ea'
      ctx.fillRect(0, 0, 256, 512)
      mottling(ctx, random, 192, ['rgba(104,117,112,.18)', 'rgba(151,157,140,.13)', 'rgba(255,255,248,.40)'])
      for (let i = 0; i < 2400; i++) {
        ctx.fillStyle = i % 3 ? 'rgba(84,97,94,.11)' : 'rgba(251,250,239,.32)'
        ctx.fillRect(random() * 256, random() * 512, .4 + random() * 1.4, .5 + random() ** 3 * 16)
      }
    })
    const paving = paintedTexture(1024, 512, ctx => {
      const random = randomFrom(475)
      ctx.drawImage(base, 0, 0, 1024, 512)
      mottling(ctx, random, 250, ['rgba(104,95,78,.25)', 'rgba(164,148,120,.19)', 'rgba(232,224,208,.32)'])
      for (let i = 0; i < 3600; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(86,81,70,.25)' : 'rgba(244,239,220,.35)'
        const grain = .4 + random() ** 2 * 2.8
        ctx.fillRect(random() * 1024, random() * 512, grain, grain * 1.2)
      }
      ctx.strokeStyle = 'rgba(68,62,54,.22)'
      ctx.lineWidth = .85
      ctx.beginPath()
      ctx.moveTo(0, 282)
      ctx.lineTo(53, 279)
      ctx.lineTo(83, 288)
      ctx.lineTo(105, 301)
      ctx.lineTo(149, 296)
      ctx.lineTo(184, 312)
      ctx.moveTo(83, 288)
      ctx.lineTo(113, 271)
      ctx.lineTo(138, 274)
      ctx.stroke()
    })
    return { post: concretePatina(base, 857), footing: concretePatina(base, 1207, true), zinc, paving }
  }, [surfaces.plaster])
  useEffect(() => () => Object.values(maps).forEach(map => map.dispose()), [maps])

  return {
    post: { ...surfaces.plaster, map: maps.post, roughness: .95 },
    footing: { ...surfaces.plaster, map: maps.footing, roughness: .99 },
    paving: { ...surfaces.plaster, map: maps.paving, roughness: .95 },
    metal: { map: maps.zinc, metalness: .42, roughness: .60, bumpMap: maps.zinc, bumpScale: .0018 },
  }
}

function Fence({ at, width, panels, angle = 0, weathered, footing }) {
  const pieces = useMemo(() => {
    const result = []
    const random = randomFrom(383 + panels)
    const step = width / panels
    const count = Math.max(1, Math.round((step - .25) / .157))
    for (let bay = 0; bay < panels; bay++) {
      for (let index = 0; index < count; index++) {
        result.push({
          at: [-width / 2 + bay * step + .127 + (index + .5) * (step - .254) / count, 1.009 + random() * .009, .017],
          size: [.080 + random() * .015, 1.141, .079],
          color: fenceColors[Math.floor(random() * fenceColors.length)],
        })
      }
    }
    return result
  }, [width, panels])
  const posts = useMemo(() => {
    const positions = Array.from({ length: panels + 1 }, (_, index) => -width / 2 + width * index / panels)
    return {
      bases: positions.map(x => ({ at: [x, .751, 0], color: pillar })),
      caps: positions.map(x => ({ at: [x, 1.54, 0], color: '#8e8a7e' })),
      ledges: positions.map(x => ({ at: [x, 1.585, 0], size: [.258, .035, .271], color: '#a29d8f' })),
      finials: positions.map(x => ({ at: [x, 1.679, 0], color: '#96958a' })),
    }
  }, [width, panels])

  return <group position={at} rotation-y={angle}>
    <Block at={[0, .183, -.005]} size={[width + .115, .47, .237]} color="#827d71" finish={footing} />
    <Block at={[0, .366, .002]} size={[width + .09, .093, .292]} color="#8b8678" finish={footing} />
    <Block at={[0, .111, .073]} size={[width + .115, .058, .189]} color="#928c7b" finish={footing} />
    <Block at={[0, .84, -.014]} size={[width - .115, .088, .119]} color="#9a9789" finish={weathered} />
    <RepeatMeshes pieces={pieces} geometry={picket} finish={weathered} />
    <RepeatMeshes pieces={posts.bases} geometry={fencePost} finish={weathered} />
    <RepeatMeshes pieces={posts.caps} geometry={fenceCap} finish={weathered} />
    <RepeatMeshes pieces={posts.ledges} finish={weathered} />
    <RepeatMeshes pieces={posts.finials} geometry={fenceFinial} finish={weathered} />
  </group>
}

function GateLeaf({ x, angle, width, finish }) {
  const hingeHeights = [.232, 1.973]
  const rails = useMemo(() => {
    const pieces = []
    for (let i = 0; i < 12; i++) pieces.push({ at: [.073 + i * (width - .146) / 11, 1.073, 0], size: [.033, 1.47, .042], color: i % 3 === 0 ? '#a9b3ad' : metal })
    for (const y of [.104, .187, .271, .357, 1.817, 1.974, 2.126, 2.254]) pieces.push({ at: [width / 2, y, .003], size: [width, y === .104 || y === 2.254 ? .059 : .040, .059], color: metal })
    for (const end of [.028, width - .029]) pieces.push({ at: [end, 1.179, 0], size: [.058, 2.203, .068], color: '#b5bcb6' })
    return pieces
  }, [width])
  const bolts = []
  for (const y of hingeHeights) {
    for (const offset of [-.048, .048]) bolts.push({ at: [.062, y + offset, .050], size: [.015, .015, .006], color: '#b9b9ac' })
  }
  for (const y of [1.062, 1.165]) {
    for (const offset of [-.039, .039]) bolts.push({ at: [width - .143 + offset, y, .069], size: [.011, .011, .005], color: '#b8bcb1' })
  }

  return <group position={[x, 0, zFence + .012]} rotation-y={angle}>
    <RepeatMeshes pieces={rails} finish={finish} />
    <Rail from={[width * .49, .988, .037]} to={[width - .051, 1.378, .037]} width={.033} depth={.046} color={metal} finish={finish} />
    <Rail from={[width * .49, .988, .037]} to={[width - .051, .626, .037]} width={.033} depth={.046} color={metal} finish={finish} />
    <Rail from={[width * .59, .988, .038]} to={[width - .052, 1.268, .038]} width={.027} depth={.035} color={metal} finish={finish} />
    <Rail from={[width * .59, .988, .038]} to={[width - .052, .733, .038]} width={.027} depth={.035} color={metal} finish={finish} />
    <Rounded at={[width - .143, 1.113, .042]} size={[.109, .135, .047]} radius={.006} color="#939e97" finish={finish} />
    <Block at={[width - .129, 1.087, .068]} size={[.008, .019, .005]} color="#575b54" />
    <Rod from={[width - .16, 1.132, .09]} to={[width - .065, 1.132, .09]} radius={.012} color="#b9bdb4" finish={finish} />
    <Cylinder at={[width - .151, 1.132, .077]} height={.026} radius={.015} rotation={[Math.PI / 2, 0, 0]} color="#b9bdb4" finish={finish} />
    {hingeHeights.map(y => <group key={y} position-y={y}>
      <Block at={[.041, 0, .039]} size={[.079, .133, .017]} color="#989e94" finish={finish} />
      <Cylinder at={[.017, -.031, .052]} height={.057} radius={.022} color="#929b92" finish={finish} />
      <Cylinder at={[.017, .032, .052]} height={.064} radius={.022} color="#a5aaa0" finish={finish} />
      <Cylinder at={[.017, .069, .052]} height={.011} radius={.018} color="#b8b9ab" finish={finish} />
    </group>)}
    <RepeatMeshes geometry={boltHead} pieces={bolts} finish={{ metalness: .48, roughness: .68 }} shadow={false} />
  </group>
}

function Gate({ finishes }) {
  const left = 1.35
  const right = 6.34
  const front = 7.338
  const back = 5.663
  const ridgeZ = (front + back) / 2
  const half = (front - back) / 2
  const hip = .82
  const eave = 2.795
  const high = 3.274
  const rise = high - eave
  const ridgeLeft = [left + hip, high + .043, ridgeZ]
  const ridgeRight = [right - hip, high + .043, ridgeZ]

  return <group>
    {[leftPier, rightPier].map(x => <group key={x}>
      <Rounded at={[x, 1.204, zFence]} size={[.456, 2.416, .491]} radius={.012} color="#b3b0a1" finish={finishes.post} />
      <Rounded at={[x, .069, zFence]} size={[.475, .133, .51]} radius={.009} color="#918a76" finish={finishes.footing} />
      <Block at={[x, 2.533, zFence]} size={[.224, .269, .249]} color="#5d4c41" finish={finishes.post} />
      <Block at={[x, 2.665, zFence]} size={[.276, .058, .39]} color="#58483f" />
    </group>)}
    <Block at={[(left + right) / 2, 2.678, ridgeZ]} size={[4.65, .107, .19]} color="#5b4a3e" />
    <Block at={[(left + right) / 2, 2.707, front - .126]} size={[4.84, .098, .11]} color="#665044" />
    <RepeatMeshes pieces={Array.from({ length: 17 }, (_, i) => ({ at: [left + .22 + i * .284, 2.727, ridgeZ], size: [.04, .073, 1.44], color: '#70594a' }))} finish={{ roughness: .82 }} />
    <RoofPlane from={[left, eave, front]} to={[right, eave, front]} uphill={[0, rise, -half]} inset={hip} seed={94} course={.273} gauge={.205} fascia="#6c4d42" />
    <RoofPlane from={[right, eave, back]} to={[left, eave, back]} uphill={[0, rise, half]} inset={hip} seed={54} course={.273} gauge={.205} fascia="#6c4d42" />
    <RoofPlane from={[left, eave, back]} to={[left, eave, front]} uphill={[hip, rise, 0]} inset={half} seed={18} course={.264} gauge={.199} fascia="#6c4d42" />
    <RoofPlane from={[right, eave, front]} to={[right, eave, back]} uphill={[-hip, rise, 0]} inset={half} seed={77} course={.264} gauge={.199} fascia="#6c4d42" />
    <Ridge from={ridgeLeft} to={ridgeRight} radius={.73} />
    {[front, back].map(z => <group key={z}>
      <Ridge from={[left, eave + .05, z]} to={ridgeLeft} radius={.65} />
      <Ridge from={[right, eave + .05, z]} to={ridgeRight} radius={.65} />
    </group>)}
    <GateLeaf x={leftPier + .238} angle={.371} width={1.701} finish={finishes.metal} />
    <GateLeaf x={rightPier - .238} angle={Math.PI - .683} width={1.697} finish={finishes.metal} />
  </group>
}

function Shrub({ at, size, seed, sparse = false }) {
  const pieces = useMemo(() => {
    const random = randomFrom(seed)
    const colors = ['#526332', '#5f6d37', '#687840', '#4b6131', '#798249', '#43592e', '#879052']
    return Array.from({ length: sparse ? 215 : 470 }, (_, index) => {
      const azimuth = random() * Math.PI * 2
      const theta = Math.acos(2 * random() - 1)
      const density = Math.pow(random(), .43) * (.77 + .24 * Math.sin(azimuth * 6 + seed))
      const radius = density * Math.sin(theta)
      const len = .11 + random() * .158
      return {
        at: [Math.cos(azimuth) * radius, .88 + Math.cos(theta) * density * .73, Math.sin(azimuth) * radius],
        size: [len, len * .62, len * (.41 + random() * .25)],
        rotation: [random() * 2.9, azimuth, random() - .45],
        color: colors[index % colors.length],
      }
    })
  }, [seed, sparse])
  return <group position={at} scale={size}>
    {[0, 1.7, 3.35, 4.98].map(angle => <Rod key={angle} from={[0, .06, 0]} to={[Math.cos(angle) * .38, .83, Math.sin(angle) * .38]} radius={.024} taper={.27} color="#716346" />)}
    <RepeatMeshes pieces={pieces} geometry={sparse ? distantLeaf : leaf} distantGeometry={sparse ? undefined : distantLeaf} detailDistance={11}
      finish={{ roughness: .91, side: DoubleSide }} shadow={!sparse} />
  </group>
}

function GardenShrine() {
  return <group position={[-4.074, .028, 4.027]} rotation-y={-.06}>
    <Block at={[0, .074, 0]} size={[.608, .143, .48]} color="#aba297" />
    <Block at={[0, .319, 0]} size={[.378, .399, .346]} color="#bd9b66" />
    <Block at={[0, .55, .011]} size={[.544, .082, .442]} color="#9fa199" />
    <Block at={[0, .812, -.063]} size={[.427, .471, .334]} color="#bd8750" />
    <Block at={[0, .839, .117]} size={[.266, .362, .037]} color="#4d6590" />
    <Block at={[0, .791, .138]} size={[.158, .207, .011]} color="#394c62" />
    <Rounded at={[0, .775, .159]} size={[.061, .116, .033]} radius={.018} color="#c7b797" />
    {[-.176, .176].map(x => <Cylinder key={x} at={[x, .828, .163]} height={.461} radius={.029} color="#d1a968" />)}
    <RoofPlane from={[-.319, 1.039, -.275]} to={[-.319, 1.039, .246]} uphill={[.319, .185, 0]} course={.127} gauge={.082} seed={11} fascia="#b45b55" />
    <RoofPlane from={[.319, 1.039, .246]} to={[.319, 1.039, -.275]} uphill={[-.319, .185, 0]} course={.127} gauge={.082} seed={8} fascia="#b45b55" />
    <Ridge from={[0, 1.239, -.262]} to={[0, 1.239, .258]} radius={.31} />
    {[-1, 1].map(side => <group key={side}>
      <Rod from={[side * .294, 1.058, .229]} to={[side * .339, 1.139, .23]} radius={.018} color="#cfa265" />
      <Rounded at={[side * .341, 1.145, .231]} size={[.043, .079, .033]} radius={.014} color="#d3ac69" />
    </group>)}
  </group>
}

function Cable({ start, middle, end, radius = .013 }) {
  const geometry = useMemo(() => new TubeGeometry(new QuadraticBezierCurve3(new Vector3(...start), new Vector3(...middle), new Vector3(...end)), 24, radius, 5, false), [...start, ...middle, ...end, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry}><meshStandardMaterial color="#58564e" roughness={.95} /></mesh>
}

function RoadsidePole({ weathered }) {
  const x = -7.04
  const z = 7.692
  return <group>
    <Rod from={[x, 0, z]} to={[x + .16, 6.3, z - .085]} radius={.11} taper={.67} sides={12} color="#a4a094" finish={weathered} />
    {[3.75, 4.09, 4.18].map((y, index) => <group key={y}>
      <Block at={[x + .13, y, z - .065]} size={[.228, .032, .065]} color="#77766c" />
      <Cable start={[-24, y + .13, z - .42]} middle={[-13.6, y - .47, z - .18]} end={[x + .12, y, z - .06]} radius={index === 0 ? .011 : .008} />
      <Cable start={[x + .12, y, z - .06]} middle={[7.5, y - .37, z - 4.83]} end={[24.4, y + .21, z - 6.19]} radius={index === 0 ? .011 : .008} />
    </group>)}
    <Cable start={[-24, 6.91, z - 1.28]} middle={[-14.1, 5.18, z - .91]} end={[x + .142, 5.79, z - .067]} radius={.011} />
  </group>
}

function DirtGround() {
  const map = useMemo(() => {
    const texture = paintedTexture(512, 512, ctx => {
      const random = randomFrom(719)
      ctx.fillStyle = '#a99978'
      ctx.fillRect(0, 0, 512, 512)
      for (let index = 0; index < 125; index++) {
        const x = random() * 512
        const y = random() * 512
        const span = 12 + random() * 55
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, span)
        gradient.addColorStop(0, index % 3 ? 'rgba(104,111,66,.29)' : 'rgba(211,187,143,.45)')
        gradient.addColorStop(1, 'rgba(168,151,115,0)')
        ctx.fillStyle = gradient
        ctx.fillRect(x - span, y - span, span * 2, span * 2)
      }
      for (let index = 0; index < 5200; index++) {
        ctx.fillStyle = index % 2 ? 'rgba(93,82,52,.22)' : 'rgba(197,179,133,.33)'
        ctx.fillRect(random() * 512, random() * 512, 1 + random() * 3, 1 + random() * 2)
      }
    })
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(35, 35)
    return texture
  }, [])
  useEffect(() => () => map.dispose(), [map])
  return <mesh position={[0, -.059, 0]} rotation-x={-Math.PI / 2} receiveShadow>
    <planeGeometry args={[205, 205]} />
    <meshStandardMaterial map={map} roughness={1} />
  </mesh>
}

function RoadsideGrass() {
  const pieces = useMemo(() => {
    const random = randomFrom(446)
    return Array.from({ length: 1100 }, (_, index) => {
      const side = index % 2 ? -1 : 1
      const x = side * (5.31 + (side > 0 ? 2.1 : 0) + random() * 15)
      const z = 5.13 + random() * 3.42
      const h = .033 + random() * .144
      return { at: [x, h * .4 - .023, z], size: [.016, h, .026], rotation: [random() - .5, random() * Math.PI, random() - .5], color: ['#898454', '#9d8a5d', '#9b935c', '#757846'][index % 4] }
    })
  }, [])
  return <RepeatMeshes pieces={pieces} finish={{ roughness: 1 }} shadow={false} />
}

function NeighborShed({ at, tint, roof }) {
  return <group position={at}>
    <Block at={[0, 1.25, -.94]} size={[5.2, 2.50, 3.75]} color={tint} shadow={false} />
    <Block at={[0, 1.054, .96]} size={[2.05, 2.109, .049]} color="#636a5d" shadow={false} />
    <Block at={[1.807, 1.46, .967]} size={[.88, .667, .057]} color="#838779" shadow={false} />
    <Block at={[0, 2.551, -.83]} size={[5.41, .081, 4.27]} rotation={[.081, 0, 0]} color={roof} shadow={false} />
    <Block at={[0, 2.421, 1.29]} size={[5.35, .064, .088]} color="#a8a594" shadow={false} />
  </group>
}

export function ReferenceYard({ surfaces }) {
  const finishes = useYardFinishes(surfaces)
  return <group>
    <DirtGround />
    <mesh position={[0, -.023, 10.77]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[150, 4.58]} /><meshStandardMaterial color="#bcb8ac" {...surfaces.roadConcrete} />
    </mesh>
    <Block at={[.822, -.023, 6.889]} size={[12.32, .045, 3.209]} color="#c0b6a3" finish={finishes.paving} shadow={false} />
    <Block at={[.945, -.018, -.488]} size={[12.01, .057, 14.18]} color="#c7bda9" finish={finishes.paving} shadow={false} />
    {[-4.70, -.75, 2.97, 6.72].map(x => <Block key={x} at={[x, .012, 4.67]} size={[.012, .005, 3.72]} color="#aea391" shadow={false} />)}
    {[3.645, 5.51].map(z => <Block key={z} at={[.835, .012, z]} size={[11.6, .005, .013]} color="#afa590" shadow={false} />)}
    <Block at={[3.843, .005, 7.68]} size={[3.84, .032, 1.841]} rotation={[.018, 0, 0]} color="#ccc1ad" finish={finishes.paving} shadow={false} />
    <Fence at={[-1.695, 0, zFence]} width={6.6} panels={3} weathered={finishes.post} footing={finishes.footing} />
    <Fence at={[6.558, 0, zFence]} width={1.334} panels={1} weathered={finishes.post} footing={finishes.footing} />
    <Fence at={[-5.05, 0, -.405]} width={13.93} panels={6} angle={Math.PI / 2} weathered={finishes.post} footing={finishes.footing} />
    <Fence at={[7.25, 0, -.405]} width={13.93} panels={6} angle={-Math.PI / 2} weathered={finishes.post} footing={finishes.footing} />
    <Gate finishes={finishes} />
    <GardenShrine />
    <RoadsidePole weathered={finishes.post} />
    <RoadsideGrass />
    <Shrub at={[-5.644, -.034, 5.53]} size={[.89, 1.48, 1.1]} seed={23} />
    <Shrub at={[-5.56, -.036, 3.65]} size={[1.13, 1.4, 1.07]} seed={36} />
    <Shrub at={[-6.24, -.043, 2.03]} size={[1.35, 1.7, 1.18]} seed={43} />
    <Shrub at={[-3.393, .016, 4.82]} size={[.43, .56, .46]} seed={27} />
    <Shrub at={[7.81, -.04, 5.91]} size={[1.08, 1.25, .84]} seed={69} />
    <Shrub at={[7.99, -.04, 4.68]} size={[1.17, 1.65, .99]} seed={91} />
    <Shrub at={[8.16, -.04, 3.17]} size={[1.12, 1.62, 1.13]} seed={52} />
    <Shrub at={[7.99, -.04, .87]} size={[1.07, 1.48, .98]} seed={31} />
    <NeighborShed at={[-12.67, -.03, 1.01]} tint="#939a80" roof="#777e73" />
    <NeighborShed at={[12.75, -.03, -.09]} tint="#879a83" roof="#969d91" />
    <NeighborShed at={[18.55, -.03, -1.58]} tint="#849282" roof="#9f9f90" />
    {Array.from({ length: 16 }, (_, index) => <Shrub key={index} at={[-28 + index * 3.69, -.044, -13.2 - Math.sin(index * 2) * 3.2]} size={[1.7 + index % 3 * .44, 2.02 + index % 4 * .38, 1.62]} seed={211 + index * 11} sparse />)}
  </group>
}
