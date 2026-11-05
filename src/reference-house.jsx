import React, { useEffect, useMemo } from 'react'
import { BufferGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, PlaneGeometry, RepeatWrapping, Shape, ShapeGeometry, SphereGeometry, Vector2 } from 'three'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { GableTrim, Ridge, RoofPlane, railInstance } from './roof.jsx'
import { paintedTexture } from './surfaces.js'

const white = '#f1e9d9'
const sideGreen = '#d7e1b0'
const greenTrim = '#c6d0a3'
const gableGrey = '#dde2e5'
const wood = '#9b4b3f'
const woodEdge = '#763c33'
const trim = '#53584f'
const agedBrass = { metalness: .72, roughness: .47 }
const archCenter = 1.16
const archWidth = 1.38
const spring = 2.88
const archRise = .91
const archFront = 3.66

function triangle(half, height) {
  return new Shape().moveTo(-half, 0).lineTo(half, 0).lineTo(0, height).closePath()
}

const mainGable = new ShapeGeometry(triangle(3.47, 2.75))
const sideGable = new ShapeGeometry(triangle(4.04, 2.39))

const oculusMolding = new LatheGeometry([
  [.335, 0], [.334, .018], [.319, .023], [.318, .036], [.306, .051],
  [.285, .060], [.275, .055], [.268, .044], [.258, .043], [.255, .033],
  [.246, .028], [.246, .011],
].map(([radius, depth]) => new Vector2(radius, depth)), 64).rotateX(Math.PI / 2)

function Oculus({ at }) {
  return <group position={at}>
    <Cylinder at={[0, 0, .006]} height={.032} radius={.337} color="#93997d" rotation={[Math.PI / 2, 0, 0]} />
    <mesh geometry={oculusMolding} castShadow receiveShadow>
      <meshStandardMaterial color={greenTrim} roughness={.77} side={DoubleSide} />
    </mesh>
    <mesh position-z={.028}>
      <circleGeometry args={[.249, 56]} />
      <meshPhysicalMaterial color="#374754" metalness={.19} roughness={.19} clearcoat={.64} clearcoatRoughness={.16} />
    </mesh>
    {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(angle => <group key={angle} rotation-z={angle}>
      <Rounded at={[0, .33, .031]} size={[.112, .083, .048]} radius={.014} color="#b8c597" />
      <Rounded at={[0, .368, .033]} size={[.086, .066, .051]} radius={.021} color={greenTrim} />
      <Rounded at={[0, .405, .021]} size={[.052, .040, .037]} radius={.017} color="#b7c399" />
    </group>)}
  </group>
}

function MainRoof({ cladding, surfaces }) {
  const center = -.83
  const left = -4.44
  const right = 2.78
  const back = -8.06
  const front = 2.10
  const eave = 3.08
  const ridge = 5.96
  const cross = -3.7
  const crossFront = .55
  const crossBack = -7.95
  const crossEave = 3.06
  const crossRidge = 5.56
  const sideX = 3.43

  return <group>
    <RoofPlane from={[left, eave, back]} to={[left, eave, front]} uphill={[center - left, ridge - eave, 0]} seed={47} />
    <RoofPlane from={[right, eave, front]} to={[right, eave, back]} uphill={[center - right, ridge - eave, 0]} seed={78} />
    <RoofPlane from={[sideX, crossEave, crossBack]} to={[left, crossEave, crossBack]} uphill={[0, crossRidge - crossEave, cross - crossBack]} seed={84} />
    <RoofPlane from={[left, crossEave, crossFront]} to={[sideX, crossEave, crossFront]} uphill={[0, crossRidge - crossEave, cross - crossFront]} seed={31} />
    <Ridge from={[center, ridge + .04, back + .04]} to={[center, ridge + .04, front + .02]} radius={.74} />
    <Ridge from={[left, crossRidge + .036, cross]} to={[sideX, crossRidge + .036, cross]} radius={.72} />
    {[front - .056, back + .075].map((z, index) => <group key={z} position={[center, 3.058, z]} rotation-y={index * Math.PI}>
      <mesh geometry={mainGable} castShadow receiveShadow>
        <meshStandardMaterial color={gableGrey} map={cladding} roughness={.89} />
      </mesh>
      <GableTrim from={[-3.58, .025, .062]} peak={[0, 2.871, .062]} to={[3.58, .025, .062]} />
    </group>)}
    {[sideX - .126, left + .128].map((x, index) => <group key={x} position={[x, 3.045, cross]} rotation-y={(index ? -1 : 1) * Math.PI / 2}>
      <mesh geometry={sideGable} castShadow receiveShadow><meshStandardMaterial color={sideGreen} {...surfaces.plaster} /></mesh>
      <GableTrim from={[-4.204, .012, .096]} peak={[0, 2.509, .096]} to={[4.204, .012, .096]} />
      <Rounded at={[0, 1.49, .026]} size={[.152, .332, .044]} radius={.034} color="#494f41" />
      <Block at={[0, 1.328, .055]} size={[.171, .023, .058]} color="#bdc6a0" />
    </group>)}
    <Oculus at={[center - .05, 4.78, front + .019]} />
  </group>
}

function archShape() {
  const shape = new Shape().moveTo(-2.05, spring).lineTo(-archWidth, spring)
  for (let i = 1; i <= 36; i++) {
    const theta = Math.PI * (1 - i / 36)
    shape.lineTo(Math.cos(theta) * archWidth, spring + Math.sin(theta) * archRise)
  }
  return shape.lineTo(2.05, spring).lineTo(0, 4.78).closePath()
}

const archRecess = new Shape()
archRecess.moveTo(1.62, 2.837)
for (let i = 0; i <= 36; i++) {
  const theta = Math.PI * i / 36
  archRecess.lineTo(Math.cos(theta) * 1.62, 2.89 + Math.sin(theta) * 1.03)
}
archRecess.lineTo(-1.62, 2.837).closePath()
const recessedSoffit = new ShapeGeometry(archRecess)

const capitalProfile = new LatheGeometry([
  [.093, 2.160], [.104, 2.167], [.113, 2.178], [.114, 2.192], [.103, 2.201],
  [.105, 2.218], [.112, 2.236], [.122, 2.253], [.138, 2.269], [.161, 2.280],
  [.169, 2.291], [.169, 2.308], [.159, 2.313],
].map(([radius, height]) => new Vector2(radius, height)), 36)
const capitalPetal = new SphereGeometry(1, 8, 6)
const capitalPetals = Array.from({ length: 12 }, (_, index) => {
  const angle = index * Math.PI / 6
  return {
    at: [Math.sin(angle) * .129, 2.250, Math.cos(angle) * .129],
    size: [.015, .043, .012],
    rotation: [-.34, angle, 0, 'YXZ'],
    color: index % 3 === 0 ? '#bdcaa5' : '#c9d5b2',
  }
})

function PorchColumn({ x, surfaces }) {
  return <group position={[x, .365, archFront - .275]}>
    <Rounded at={[0, .048, 0]} size={[.338, .095, .331]} radius={.012} color="#d1cbb7" finish={surfaces.plaster} />
    <Rounded at={[0, .115, 0]} size={[.296, .051, .286]} radius={.009} color="#e3dfce" />
    <Cylinder at={[0, .146, 0]} height={.018} radius={.135} color="#d6d8c3" />
    <Cylinder at={[0, .174, 0]} height={.047} radius={.134} top={.114} color="#e1decb" />
    <Cylinder at={[0, 1.179, 0]} height={1.994} radius={.114} top={.095} color="#e1e4ce" finish={surfaces.plaster} />
    <mesh geometry={capitalProfile} castShadow receiveShadow>
      <meshStandardMaterial color="#c3d0ad" roughness={.78} />
    </mesh>
    <RepeatMeshes geometry={capitalPetal} pieces={capitalPetals} finish={{ roughness: .78 }} shadow={false} />
    <Rounded at={[0, 2.320, 0]} size={[.344, .052, .333]} radius={.008} color="#d9dfc5" />
    <Block at={[0, 2.350, 0]} size={[.367, .014, .348]} color="#bfc9aa" />
    <Rounded at={[0, 2.378, 0]} size={[.409, .047, .366]} radius={.007} color="#dce2c8" />
  </group>
}

function Porch({ cladding, surfaces }) {
  const front = archFront + .085
  // Meet the front wall without letting the porch eaves project into the rooms.
  const back = 1.82
  const half = 2.105
  const eave = 2.966
  const top = 4.88
  const arch = useMemo(() => new ExtrudeGeometry(archShape(), { depth: .22, bevelEnabled: false }), [])
  useEffect(() => () => arch.dispose(), [arch])
  const molding = useMemo(() => {
    const ring = new Shape()
    for (let i = 0; i <= 42; i++) {
      const angle = Math.PI * (1 - i / 42)
      ring[i ? 'lineTo' : 'moveTo'](Math.cos(angle) * (archWidth + .048), spring + Math.sin(angle) * (archRise + .055))
    }
    for (let i = 42; i >= 0; i--) {
      const angle = Math.PI * (1 - i / 42)
      ring.lineTo(Math.cos(angle) * archWidth, spring + Math.sin(angle) * archRise)
    }
    ring.closePath()
    return new ExtrudeGeometry(ring, { depth: .031, bevelEnabled: false })
  }, [])
  useEffect(() => () => molding.dispose(), [molding])

  return <group>
    <RoofPlane from={[archCenter - half, eave, back]} to={[archCenter - half, eave, front]} uphill={[half, top - eave, 0]} seed={92} />
    <RoofPlane from={[archCenter + half, eave, front]} to={[archCenter + half, eave, back]} uphill={[-half, top - eave, 0]} seed={46} />
    <Ridge from={[archCenter, top + .025, back]} to={[archCenter, top + .025, front + .02]} radius={.67} />
    <mesh geometry={arch} position={[archCenter, 0, archFront - .199]} castShadow receiveShadow>
      <meshStandardMaterial color={gableGrey} map={cladding} roughness={.87} />
    </mesh>
    <mesh geometry={molding} position={[archCenter, 0, archFront + .034]} castShadow receiveShadow>
      <meshStandardMaterial color={greenTrim} roughness={.85} />
    </mesh>
    <mesh geometry={recessedSoffit} position={[archCenter, 0, archFront - .335]} receiveShadow>
      <meshStandardMaterial color="#ede5d2" {...surfaces.plaster} />
    </mesh>
    <GableTrim from={[archCenter - half, eave - .052, archFront + .049]} peak={[archCenter, top - .045, archFront + .049]} to={[archCenter + half, eave - .052, archFront + .049]} />
    <Rounded at={[archCenter, spring + archRise + .068, archFront + .069]} size={[.16, .12, .075]} radius={.024} color="#c1cea0" />
    {[-1, 1].map(side => <group key={side}>
      <Block at={[archCenter + side * 1.727, 2.837, archFront - .078]} size={[.691, .102, .363]} color="#eee9d8" />
      <Block at={[archCenter + side * 1.73, 2.892, archFront + .104]} size={[.676, .034, .026]} color={greenTrim} />
      <PorchColumn x={archCenter + side * archWidth} surfaces={surfaces} />
    </group>)}
    <Block at={[archCenter, 2.812, 2.575]} size={[3.91, .071, 1.78]} color="#e8e1d1" />
    <Block at={[archCenter, .185, 2.612]} size={[4.08, .341, 1.87]} color="#aaaba2" finish={surfaces.plaster} />
    <Block at={[archCenter, .351, 2.637]} size={[4.13, .039, 1.94]} color="#e6dfca" />
    {[[.109, 3.74, 4.02], [.219, 3.56, 3.97], [.309, 3.40, 3.92]].map(([y, z, width]) => <Block key={z} at={[archCenter, y / 2, z]} size={[width, y, .38]} color="#b0aea4" finish={surfaces.plaster} />)}
  </group>
}

function raisedFields(width, height, fieldWidth, openings) {
  const positions = []
  const colors = []
  const uvs = []
  const indices = []
  const profile = [
    [0, .051, .98], [.15, .049, .89], [.27, .037, .73], [.41, .036, .78],
    [.56, .043, .94], [.68, .045, .97], [.88, .059, 1.16], [1, .061, 1.02],
  ]

  for (const [y, fieldHeight] of openings) {
    const start = positions.length / 3
    const lip = Math.min(.049, fieldWidth * .20, fieldHeight * .16)
    for (const [fraction, z, shade] of profile) {
      const x = fieldWidth / 2 - lip * fraction
      const h = fieldHeight / 2 - lip * fraction
      for (const [px, py] of [[-x, y - h], [x, y - h], [x, y + h], [-x, y + h]]) {
        positions.push(px, py, z)
        colors.push(shade, shade, shade)
        uvs.push(px / width + .5, py / height + .5)
      }
    }
    for (let band = 0; band < profile.length - 1; band++) {
      const edge = start + band * 4
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4
        indices.push(edge + i, edge + next, edge + next + 4, edge + i, edge + next + 4, edge + i + 4)
      }
    }
    const center = start + (profile.length - 1) * 4
    indices.push(center, center + 1, center + 2, center, center + 2, center + 3)
  }

  const indexed = new BufferGeometry()
  indexed.setIndex(indices)
  indexed.setAttribute('position', new Float32BufferAttribute(positions, 3))
  indexed.setAttribute('color', new Float32BufferAttribute(colors, 3))
  indexed.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  const relief = indexed.toNonIndexed()
  indexed.dispose()
  relief.computeVertexNormals()
  return relief
}

function TimberPanel({ at, width, height, surfaces, lower = false }) {
  const { field, frame } = useMemo(() => {
    const stile = Math.min(.086, width * .18)
    const fieldWidth = width - 2 * stile
    const proportions = lower ? [[-.225, .349], [.207, .376]] : [[-.302, .232], [0, .241], [.302, .232]]
    const openings = proportions.map(([y, h]) => [y * height, h * height])
    const frame = [-1, 1].map(side => ({ at: [side * (width - stile) / 2, 0, .037], size: [stile, height - .01, .028], color: wood }))
    let railBase = -height / 2
    for (const [y, h] of [...openings, [height / 2, 0]]) {
      const railTop = y - h / 2
      frame.push({ at: [0, (railBase + railTop) / 2, .037], size: [fieldWidth, railTop - railBase, .028], color: '#914237' })
      railBase = y + h / 2
    }
    return { field: raisedFields(width, height, fieldWidth, openings), frame }
  }, [width, height, lower])
  useEffect(() => () => field.dispose(), [field])

  return <group position={at}>
    <Rounded at={[0, 0, -.006]} size={[width, height, .071]} radius={.008} color={woodEdge} finish={surfaces.redWood} />
    <RepeatMeshes pieces={frame} finish={surfaces.redWood} />
    <mesh geometry={field} castShadow receiveShadow>
      <meshStandardMaterial color={wood} {...surfaces.redWood} vertexColors />
    </mesh>
  </group>
}

const screwHead = new CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2)

function Hinge({ at, side, bronze = false }) {
  const color = bronze ? '#8f7859' : '#65554c'
  return <group position={at}>
    <Rounded at={[side * .017, 0, 0]} size={[.043, .063, .006]} radius={.003} color={color} finish={agedBrass} />
    <Cylinder at={[0, 0, .009]} height={.072} radius={.007} color={color} finish={agedBrass} shadow={false} />
    <Cylinder at={[0, .037, .009]} height={.006} radius={.009} color="#9e8465" finish={agedBrass} shadow={false} />
    <RepeatMeshes geometry={screwHead} pieces={[-.019, .019].map(y => ({ at: [side * .022, y, .004], size: [.0032, .0032, .003], color: '#a68a6a' }))} finish={agedBrass} shadow={false} />
  </group>
}

function ShutterWindow({ at, width, height, angle = 0, surfaces, open = true, glazed = false, glassOpacity = .68, showBars = true, swing = 1.10, fold = .37 }) {
  const plank = width / 4
  const bars = Array.from({ length: 8 }, (_, i) => ({ at: [0, -height / 2 + .121 + i * (height - .24) / 7, .073], size: [width - .093, .017, .017], color: '#514940' }))
  for (const x of [-.33, -.16, .16, .33]) bars.push({ at: [width * x, 0, .074], size: [.018, height - .112, .020], color: '#403f39' })
  const frame = [
    ...[-1, 1].map(side => ({ at: [side * width * .5, 0, .035], size: [.058, height + .039, .081], color: '#874035' })),
    ...[-1, 1].map(side => ({ at: [0, side * height * .5, .036], size: [width + .088, .066, .088], color: '#a45346' })),
    { at: [0, 0, .060], size: [.057, height - .083, .061], color: '#733e34' },
  ]

  return <group position={at} rotation-y={angle}>
    {!glazed && <Block at={[0, 0, -.033]} size={[width + .076, height + .105, .092]} color="#8a4238" />}
    <RepeatMeshes pieces={frame} finish={surfaces.redWood} />
    {[-1, 1].map(side => <mesh key={side} position={[side * (width - .079) / 4, 0, .034]}>
      <planeGeometry args={[(width - .108) / 2, height - .096]} />
      <meshPhysicalMaterial color={glazed ? '#414744' : '#302a27'} roughness={.32} metalness={.14} clearcoat={.53} clearcoatRoughness={.19}
        side={glazed ? DoubleSide : undefined} transparent={glazed} opacity={glazed ? glassOpacity : 1} depthWrite={!glazed} />
    </mesh>)}
    {showBars && <RepeatMeshes pieces={bars} finish={{ roughness: .64, metalness: .23 }} shadow={false} />}
    {[-1, 1].map(side => <group key={side}>
      <group position={[side * (width / 2 - .04), 0, .105]} rotation-y={side * (open ? swing : 0)}>
        <TimberPanel at={[-side * plank * .47, 0, 0]} width={plank - .025} height={height - .053} surfaces={surfaces} />
        {[-.32, .32].map(y => <Hinge key={y} at={[0, y * height, .043]} side={-side} />)}
        <group position={[-side * plank * .94, 0, 0]} rotation-y={side * (open ? -fold : 0)}>
          <TimberPanel at={[-side * plank * .47, 0, .005]} width={plank - .029} height={height - .058} surfaces={surfaces} />
          <Rounded at={[-side * plank * .84, -.021, .075]} size={[.014, .047, .013]} radius={.004} color="#87725c" finish={agedBrass} />
        </group>
      </group>
    </group>)}
    <Rounded at={[0, -height / 2 - .044, .017]} size={[width + .23, .057, .268]} radius={.008} color="#ded7c7" finish={surfaces.plaster} />
  </group>
}

function MainDoor({ surfaces, door }) {
  return <group position={[1.10, 1.465, 1.81]}>
    <Rounded at={[0, 1.14, .023]} size={[2.055, .077, .155]} radius={.008} color="#a65c4c" finish={surfaces.redWood} />
    {[-1, 1].map((side, index) => <group key={side} position={[side * .956, 0, .07]}>
      <Rounded at={[side * .030, 0, -.018]} size={[.075, 2.209, .143]} radius={.008} color="#914236" finish={surfaces.redWood} />
      {[-.768, .729].map(y => <Hinge key={y} at={[-side * .017, y, .045]} side={-side} bronze />)}
      <group ref={node => { door.current[index] = node }}>
        <TimberPanel at={[-side * .48, 0, 0]} width={.951} height={2.18} surfaces={surfaces} lower />
        <group position={[-side * .881, -.183, .065]}>
          <Rounded at={[0, 0, 0]} size={[.048, .132, .018]} radius={.007} color="#9c7651" finish={agedBrass} />
          <Rounded at={[0, -.023, .010]} size={[.007, .016, .002]} radius={.002} color="#4a3c32" />
          <RepeatMeshes geometry={screwHead} pieces={[-.048, .053].map(y => ({ at: [0, y, .010], size: [.0043, .0043, .004], color: '#b69975' }))} finish={agedBrass} shadow={false} />
          <Rod from={[0, .034, .006]} to={[0, .036, .043]} radius={.010} color="#a58761" finish={agedBrass} />
          <Rod from={[0, .036, .041]} to={[side * .098, .038, .047]} radius={.011} taper={.74} color="#bb9d72" finish={agedBrass} />
        </group>
      </group>
    </group>)}
    <Rounded at={[0, -1.101, .112]} size={[2.06, .049, .25]} radius={.006} color="#a09b8b" finish={surfaces.plaster} />
    <Block at={[0, 1.23, .081]} size={[.158, .084, .039]} color="#aa8c57" />
  </group>
}

function Lamp({ at }) {
  return <group position={at}>
    <Block at={[0, 0, 0]} size={[.081, .135, .032]} color="#49433c" />
    <Cylinder at={[0, .002, .043]} height={.093} radius={.035} color="#c6ab83" />
    <Cylinder at={[0, .058, .043]} height={.037} radius={.049} top={.023} color="#61594b" />
    <Cylinder at={[0, -.056, .043]} height={.019} radius={.043} color="#63594a" />
    {[-.028, .028].map(x => <Rod key={x} from={[x, -.042, .069]} to={[x, .043, .069]} radius={.005} color="#61594b" />)}
  </group>
}

function corrugation(z) {
  const rib = Math.abs((z + 5.04) / .195 % 1 - .5)
  return .021 * Math.max(0, Math.min(1, (.223 - rib) / .115))
}

const sheet = new PlaneGeometry(4.23, 10.08, 4, 650).rotateX(-Math.PI / 2)
const sheetTones = []
for (let i = 0; i < sheet.attributes.position.count; i++) {
  const positions = sheet.attributes.position
  const x = positions.getX(i)
  const z = positions.getZ(i)
  const panel = Math.floor((z + 5.04) / .975)
  const tone = .84 + (panel * 17 % 7) * .025 + .055 * Math.sin(x * 2.4 + z * 4.1)
  positions.setY(i, -.077 * x + corrugation(z))
  sheetTones.push(tone, tone, tone)
}
sheet.setAttribute('color', new Float32BufferAttribute(sheetTones, 3))
sheet.computeVertexNormals()

const sheetScrew = new CylinderGeometry(1, 1, 1, 6)
const sheetScrews = [3.10, 4.47, 5.90, 7.08].flatMap(x => Array.from({ length: 25 }, (_, row) => {
  const z = -7.26 + (row * 2 + .5) * .195
  return { at: [x, 2.787 - (x - 5.03) * .077 + corrugation(z + 2.22), z], size: [.010, .006, .010], color: row % 5 ? '#afb2aa' : '#969c96' }
}))

const awningFrame = [
  ...[2.77, 1.20, -.43, -2.04, -3.66, -5.29, -7.15].flatMap(z => [
    railInstance([2.96, 2.92, z], [7.135, 2.603, z], .048, trim, .041),
    railInstance([3.03, 2.684, z], [7.135, 2.536, z], .043, '#454943', .041),
    ...Array.from({ length: 7 }, (_, i) => railInstance([3.11 + i * .55, 2.677 - i * .019, z], [3.61 + i * .55, 2.871 - i * .043, z], .028, '#4d514b')),
  ]),
  ...[3.01, 4.47, 5.90, 7.083].map(x => railInstance([x, 2.734 - (x - 3.01) * .074, -7.245], [x, 2.734 - (x - 3.01) * .074, 2.84], .061, '#585c52', .055)),
  railInstance([7.155, 2.601, -7.279], [7.155, 2.601, 2.833], .034, '#848b84', .064),
  railInstance([7.178, 2.622, -7.279], [7.178, 2.622, 2.833], .022, '#a2a8a0', .018),
  ...[2.53, -.715, -3.959, -7.03].flatMap(z => [
    { at: [6.97, 1.274, z], size: [.075, 2.53, .077], color: '#727970' },
    { at: [6.97, .064, z], size: [.152, .116, .145], color: '#85857b' },
    railInstance([6.97, 2.29, z], [6.61, 2.55, z], .045, '#5e665c'),
  ]),
  railInstance([2.92, 2.986, 2.83], [7.15, 2.658, 2.83], .091, '#a9aaa0', .052),
]

function SideAwning() {
  return <group>
    <mesh geometry={sheet} position={[5.03, 2.78, -2.22]} castShadow receiveShadow>
      <meshStandardMaterial color="#8b928d" roughness={.53} metalness={.43} side={DoubleSide} vertexColors />
    </mesh>
    <RepeatMeshes geometry={sheetScrew} pieces={sheetScrews} finish={{ roughness: .66, metalness: .42 }} shadow={false} />
    <RepeatMeshes pieces={awningFrame} finish={{ roughness: .82 }} />
    <Block at={[4.86, 2.767, 2.865]} size={[.185, .119, .035]} color="#48617a" />
    <Block at={[4.86, 2.763, 2.886]} size={[.138, .073, .009]} color="#dce0d8" />
  </group>
}

const frontWalls = [
  [-4.033, -3.548, .30, 3.06], [-1.540, .128, .30, 3.06], [2.072, 3.100, .30, 3.06],
  [-3.548, -1.540, .30, .89], [-3.548, -1.540, 2.71, 3.06], [.128, 2.072, 2.57, 3.06],
]

export function ReferenceHouse({ surfaces, door, exterior, roof, inside = false }) {
  const cladding = useMemo(() => paintedTexture(512, 256, ctx => {
    ctx.fillStyle = '#e2e5e9'
    ctx.fillRect(0, 0, 512, 256)
    for (let y = 0; y < 256; y += 14) {
      ctx.fillStyle = '#d8dde1'
      ctx.fillRect(0, y, 512, 1.2)
      ctx.fillStyle = '#ecedef'
      ctx.fillRect(0, y + 1.3, 512, .8)
      ctx.fillStyle = '#dce0e5'
      for (let x = (y / 14 % 2) * 37; x < 512; x += 74) ctx.fillRect(x, y + 2, .8, 11)
    }
  }), [])
  useEffect(() => {
    cladding.wrapS = cladding.wrapT = RepeatWrapping
    cladding.repeat.set(.27, .66)
    cladding.needsUpdate = true
    return () => cladding.dispose()
  }, [cladding])

  return <group>
    <Block at={[-.464, .15, -3.102]} size={[7.235, .306, 9.848]} color="#c9c4b0" finish={surfaces.plaster} />
    <Block at={[-3.954, 1.68, -3.139]} size={[.156, 2.76, 9.78]} color={sideGreen} finish={surfaces.plaster} />
    {[
      [.30, .35, -8.029, 1.751], [.35, 1.02, -8.029, -3.47], [.35, 1.02, -2.55, 1.751],
      [1.02, 1.15, -8.029, -3.47], [1.15, 2.59, -8.029, -5.28], [1.15, 2.59, -4.36, -3.47],
      [1.02, 2.59, -2.55, -1.11], [1.02, 2.59, .91, 1.751], [2.59, 3.06, -8.029, 1.751],
    ].map(([bottom, top, start, end]) =>
      <Block key={`${bottom}:${start}`} at={[3.021, (bottom + top) / 2, (start + end) / 2]} size={[.156, top - bottom, end - start]} color={sideGreen} finish={surfaces.plaster} />)}
    {/* Leave a genuine opening through the rear wall behind the small barred window. */}
    {[
      [-4.025, -.47, .30, 3.06], [.03, 3.091, .30, 3.06],
      [-.47, .03, .30, 1.10], [-.47, .03, 1.86, 3.06],
    ].map(([left, right, bottom, top]) => <Block key={`rear:${left}:${bottom}`} at={[(left + right) / 2, (bottom + top) / 2, -7.950]} size={[right - left, top - bottom, .152]} color={sideGreen} finish={surfaces.plaster} />)}
    {frontWalls.map(([left, right, bottom, top]) => <Block key={`${left}:${bottom}`} at={[(left + right) / 2, (bottom + top) / 2, 1.713]} size={[right - left, top - bottom, .208]} color={white} finish={surfaces.plaster} />)}
    <Block at={[-1.958, .37, 1.831]} size={[4.16, .135, .11]} color="#bab9a8" />
    <Block at={[2.586, .37, 1.831]} size={[1.028, .135, .11]} color="#bab9a8" />
    <Block at={[-2.459, 2.904, 1.854]} size={[3.85, .12, .195]} color="#d7dfbd" />
    <Block at={[2.545, 2.971, 1.83]} size={[.976, .098, .168]} color="#d9dec2" />
    <MainDoor surfaces={surfaces} door={door} />
    <group ref={exterior}>
      <group ref={roof}>
        <MainRoof cladding={cladding} surfaces={surfaces} />
      </group>
      {/* The porch is visible through the entrance even while the main roof is culled indoors. */}
      <Porch cladding={cladding} surfaces={surfaces} />
      <ShutterWindow at={[-2.542, 1.80, 1.846]} width={2.098} height={1.80} surfaces={surfaces} glazed glassOpacity={.30} showBars={false} open={false} />
      <RoofPlane from={[-4.23, 2.805, 2.274]} to={[-.534, 2.805, 2.274]} uphill={[0, .317, -.62]} course={.245} gauge={.148} seed={34} fascia="#e8ddc5" />
      {[-.159, 2.277].map(x => <Lamp key={x} at={[x, 2.446, 1.893]} />)}
      <Block at={[-3.822, 2.491, 1.855]} size={[.181, .124, .062]} color="#404842" />
      <Block at={[-3.822, 2.49, 1.893]} size={[.128, .074, .018]} color="#adb8b3" />
      <ShutterWindow at={[3.103, 1.805, -.10]} width={2.02} height={1.57} angle={Math.PI / 2} surfaces={surfaces} glazed glassOpacity={.13} showBars={false} swing={1.53} fold={.15} />
      <ShutterWindow at={[3.103, 1.87, -4.82]} width={.92} height={1.44} angle={Math.PI / 2} surfaces={surfaces} glazed glassOpacity={.11} showBars={false} swing={1.53} fold={.15} />
      {[-.82, -3.03].map((z, index) => <group key={z}>
        <ShutterWindow at={[-4.031, 1.56, z]} width={.88} height={1.246} angle={-Math.PI / 2} surfaces={surfaces} open={false} />
        <RoofPlane from={[-4.489, 2.228, z - .583]} to={[-4.489, 2.228, z + .583]} uphill={[.518, .195, 0]} course={.216} gauge={.145} seed={16 + index} />
      </group>)}
      <ShutterWindow at={[-2.48, 1.57, -8.048]} width={1.17} height={1.21} angle={Math.PI} surfaces={surfaces} open={false} />
      <SideAwning />
    </group>
  </group>
}
