import React, { useEffect, useMemo } from 'react'
import { BufferGeometry, DoubleSide, Euler, Float32BufferAttribute, Matrix4, NoColorSpace, Quaternion, Vector3 } from 'three'
import { Block, RepeatMeshes, Rod } from './model-parts.jsx'
import { paintedTexture, randomFrom } from './surfaces.js'

const clay = ['#a85146', '#a25043', '#af594a', '#a44b41', '#aa5648', '#9c4b42', '#b15d4e', '#9d4d44']

function profiledTile(stations, acrossSteps, profile) {
  const points = []
  const uv = []
  const faces = []
  const stride = acrossSteps + 1

  function vertex(length, across, depth = 0) {
    points.push(...profile(length, across, depth))
    uv.push(length, across)
  }

  for (const station of stations) {
    for (let j = 0; j <= acrossSteps; j++) vertex(station, j / acrossSteps)
  }
  for (let i = 0; i < stations.length - 1; i++) {
    for (let j = 0; j < acrossSteps; j++) {
      const start = i * stride + j
      faces.push(start, start + 1, start + stride, start + 1, start + stride + 1, start + stride)
    }
  }

  // Duplicate the rim vertices so the face beneath each lap keeps its sharp edge.
  for (const [station, thickness] of [[0, .015], [1, .008]]) {
    const start = points.length / 3
    for (let j = 0; j <= acrossSteps; j++) {
      vertex(station, j / acrossSteps)
      vertex(station, j / acrossSteps, thickness)
    }
    for (let j = 0; j < acrossSteps; j++) {
      const edge = start + j * 2
      if (station === 0) faces.push(edge, edge + 1, edge + 2, edge + 2, edge + 1, edge + 3)
      else faces.push(edge, edge + 2, edge + 1, edge + 2, edge + 3, edge + 1)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(faces)
  geometry.computeVertexNormals()
  return geometry
}

function tileProfile(length, across, depth) {
  const barrel = .049 * Math.exp(-Math.pow((across - .56) / .203, 2))
  const sideLap = .011 * Math.exp(-Math.pow((across - .092) / .074, 2))
  const toe = length === .05 ? .006 : 0
  return [length - .5, .011 + barrel + sideLap + .013 * (1 - length) + toe - depth, across - .5]
}
const tile = profiledTile([0, .05, .19, 1], 10, tileProfile)
const distantTile = profiledTile([0, 1], 5, tileProfile)

const ridgeCap = profiledTile([0, .10, .28, 1], 12, (length, across, depth) => {
  const angle = across * Math.PI
  const outerRadius = length < .18 ? .132 : .123
  const radius = outerRadius - depth
  return [Math.cos(angle) * radius, Math.sin(angle) * radius, (length - .5) * .335]
})

let clayFinish
function terracottaFinish() {
  if (clayFinish) return clayFinish
  const map = paintedTexture(256, 256, ctx => {
    const random = randomFrom(4258)
    ctx.fillStyle = '#f9f5f1'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 54; i++) {
      const x = random() * 256
      const y = random() * 256
      const radius = 8 + random() * 37
      const patch = ctx.createRadialGradient(x, y, 0, x, y, radius)
      patch.addColorStop(0, `rgba(121,103,83,${.035 + random() * .17})`)
      patch.addColorStop(1, 'rgba(121,103,83,0)')
      ctx.fillStyle = patch
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    const lap = ctx.createLinearGradient(0, 0, 46, 0)
    lap.addColorStop(0, 'rgba(81,62,47,.17)')
    lap.addColorStop(.3, 'rgba(255,252,242,.22)')
    lap.addColorStop(1, 'rgba(255,252,242,0)')
    ctx.fillStyle = lap
    ctx.fillRect(0, 0, 46, 256)
    for (let i = 0; i < 1620; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(91,65,54,.14)' : 'rgba(255,246,222,.23)'
      ctx.fillRect(random() * 256, random() * 256, .4 + random() * 1.65, .4 + random() * 1.32)
    }
  })
  const bumpMap = paintedTexture(256, 256, ctx => {
    const random = randomFrom(4156)
    ctx.fillStyle = '#929292'
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 3400; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(50,50,50,.30)' : 'rgba(231,231,231,.32)'
      ctx.fillRect(random() * 256, random() * 256, .55 + random() * 2.1, .5 + random() * 1.6)
    }
  })
  bumpMap.colorSpace = NoColorSpace
  clayFinish = { map, bumpMap, bumpScale: .0018, roughness: .88, side: DoubleSide }
  return clayFinish
}

export function Rail({ from, to, width, depth = width, color, finish, shadow = true }) {
  return <Block {...railInstance(from, to, width, color, depth)} finish={finish} shadow={shadow} />
}

export function railInstance(from, to, width, color, depth = width) {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), direction.clone().normalize())
  return { at: start.lerp(end, .5).toArray(), size: [direction.length(), width, depth], rotation: new Euler().setFromQuaternion(orientation).toArray(), color }
}

export function RoofPlane({ from, to, uphill, inset = 0, seed = 1, course = .302, gauge = .211, fascia = '#eee4d0' }) {
  const origin = new Vector3(...from)
  const run = new Vector3(...uphill)
  const eave = new Vector3(...to).sub(origin)
  const length = run.length()
  const width = eave.length()
  const x = run.normalize()
  const z = eave.normalize()
  const y = z.clone().cross(x).normalize()
  const rotation = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z))

  const underlay = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute([
      0, -.015, 0, 0, -.015, width, length, -.015, width - inset, length, -.015, inset,
    ], 3))
    geometry.setIndex([0, 1, 2, 0, 2, 3])
    geometry.computeVertexNormals()
    return geometry
  }, [length, width, inset])
  useEffect(() => () => underlay.dispose(), [underlay])

  const pieces = useMemo(() => {
    const random = randomFrom(seed)
    const columns = Math.ceil(width / gauge)
    const pitch = width / columns
    const rows = Math.ceil(length / course)
    const rise = length / rows
    const result = []
    for (let row = 0; row < rows; row++) {
      const along = (row + .46) * rise
      const edge = inset * along / length
      for (let column = 0; column < columns; column++) {
        const middle = (column + .5) * pitch
        if (middle < edge || middle > width - edge) continue
        result.push({
          at: [along + (random() - .5) * .011 * rise, row * .0015 + (random() - .5) * .0023, middle],
          size: [rise * 1.14, .96 + random() * .08, pitch * 1.027],
          rotation: [0, (random() - .5) * .013, 0],
          color: clay[Math.floor(random() * clay.length)],
        })
      }
    }
    return result
  }, [length, width, inset, seed, course, gauge])

  return <group position={origin} quaternion={rotation}>
    <mesh geometry={underlay} castShadow receiveShadow>
      <meshStandardMaterial color="#65463e" side={DoubleSide} roughness={.95} />
    </mesh>
    <RepeatMeshes pieces={pieces} geometry={tile} distantGeometry={distantTile} finish={terracottaFinish()} />
    <Block at={[.014, -.057, width / 2]} size={[.118, .125, width + .025]} color={fascia} />
  </group>
}

export function Ridge({ from, to, radius = 1 }) {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const length = start.distanceTo(end)
  const sections = Math.ceil(length / .29)
  const span = length / sections
  const angle = Math.atan2(end.x - start.x, end.z - start.z)
  const elevation = Math.atan2(end.y - start.y, Math.hypot(end.x - start.x, end.z - start.z))
  const pieces = Array.from({ length: sections }, (_, i) => ({
    at: start.clone().lerp(end, (i + .5) / sections).toArray(),
    size: [radius, radius, span * 1.042 / .335], rotation: [-elevation, angle, 0, 'YXZ'],
    color: clay[(i * 3 + 4) % clay.length],
  }))

  return <>
    <Rod from={from} to={to} radius={.064 * radius} color="#7d4a3d" />
    <RepeatMeshes geometry={ridgeCap} pieces={pieces} finish={terracottaFinish()} />
  </>
}

export function GableTrim({ from, peak, to, color = '#f2efe3' }) {
  return <>
    <Rail from={from} to={peak} width={.154} depth={.158} color={color} />
    <Rail from={peak} to={to} width={.154} depth={.158} color={color} />
    <Rail from={[from[0], from[1] - .105, from[2]]} to={[peak[0], peak[1] - .105, peak[2]]} width={.051} depth={.194} color="#d7d5c8" />
    <Rail from={[peak[0], peak[1] - .105, peak[2]]} to={[to[0], to[1] - .105, to[2]]} width={.051} depth={.194} color="#d7d5c8" />
  </>
}
