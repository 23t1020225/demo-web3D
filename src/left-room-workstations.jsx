import React, { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, LatheGeometry, PlaneGeometry, Shape, SphereGeometry, SRGBColorSpace, TextureLoader, TubeGeometry, Vector2, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { paintedTexture } from './surfaces.js'
import deskPrintUrl from './assets/study-desk-print.webp'

const edgeBox = new RoundedBoxGeometry(1, 1, 1, 2, .029)
const wheel = new CylinderGeometry(1, 1, 1, 22)
const bead = new SphereGeometry(1, 12, 8)
const white = '#d5d4c6'
const steel = { metalness: .71, roughness: .31 }
const paint = { roughness: .47, envMapIntensity: .59 }
const sewingTop = .772
const blue = '#2d7896'
const paperPlane = new PlaneGeometry(1, 1)

function part(at, size, color, rotation) {
  return { at, size, color, rotation }
}

function casting(outline, depth, bevel) {
  const shape = new Shape()
  outline(shape)
  const geometry = new ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelSegments: 4, bevelThickness: bevel, bevelSize: bevel, curveSegments: 12,
  }).translate(0, 0, -depth / 2)
  return toCreasedNormals(geometry, .72)
}

const stitchCasting = casting(s => {
  s.moveTo(-.200, .140)
  s.quadraticCurveTo(-.214, .160, -.209, .236)
  s.bezierCurveTo(-.208, .269, -.180, .283, -.143, .288)
  s.bezierCurveTo(-.062, .301, .084, .304, .148, .289)
  s.quadraticCurveTo(.198, .279, .207, .231)
  s.quadraticCurveTo(.212, .139, .213, .044)
  s.lineTo(.089, .044)
  s.quadraticCurveTo(.104, .115, .104, .176)
  s.quadraticCurveTo(.106, .208, .074, .211)
  s.quadraticCurveTo(-.058, .219, -.109, .203)
  s.quadraticCurveTo(-.130, .191, -.133, .140)
  s.closePath()
}, .136, .013)

const overlockCasting = casting(s => {
  s.moveTo(-.107, .055)
  s.lineTo(.113, .055)
  s.quadraticCurveTo(.129, .073, .128, .098)
  s.lineTo(.117, .176)
  s.quadraticCurveTo(.112, .198, .081, .205)
  s.lineTo(-.066, .212)
  s.quadraticCurveTo(-.111, .211, -.120, .182)
  s.lineTo(-.121, .119)
  s.quadraticCurveTo(-.094, .101, -.107, .055)
  s.closePath()
}, .112, .009)

const deskGable = casting(s => {
  s.moveTo(-.111, -.001)
  s.lineTo(.110, -.001)
  s.lineTo(.003, .109)
  s.closePath()
}, .011, .002)
for (let i = 0; i < deskGable.attributes.uv.count; i++) {
  const { position, uv } = deskGable.attributes
  uv.setXY(i, .018 + (position.getX(i) + .111) / .221 * .21, .06 + position.getY(i) / .109 * .23)
}

const foldedCloth = new PlaneGeometry(.169, .141, 10, 8).rotateX(-Math.PI / 2)
for (let i = 0; i < foldedCloth.attributes.position.count; i++) {
  const vertices = foldedCloth.attributes.position
  const x = vertices.getX(i)
  const z = vertices.getZ(i)
  vertices.setY(i, .008 + .009 * Math.sin(x * 73 + z * 17) + .004 * Math.cos(z * 52))
}
foldedCloth.computeVertexNormals()

const spool = new LatheGeometry([
  new Vector2(0, 0), new Vector2(.026, 0),
  ...Array.from({ length: 37 }, (_, i) => new Vector2(.02588 - i * .00012 - ((i + 1) % 2) * .0005, (i + 1) * .00246)),
  new Vector2(.0214, .092), new Vector2(0, .092),
], 18)

function wire(points, radius) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(point => new Vector3(...point))), 16, radius, 6, false)
}

const belt = wire([[.36, .999, .043], [.37, .88, .038], [.368, .79, .025], [.359, .69, .008]], .007)
const motorCable = wire([[.46, .674, -.105], [.51, .605, -.106], [.606, .626, -.179], [.65, .738, -.198]], .006)

function ThreadRack({ at, colors, raised = false }) {
  const base = raised ? .228 : 0
  return <group position={at}>
    <Rod from={[-.075, .009, 0]} to={[-.075, .37, 0]} radius={.007} color="#afafa6" finish={steel} />
    <Rod from={[-.114, .347, 0]} to={[.152, .347, 0]} radius={.004} color="#a7aa9e" finish={steel} />
    {raised && <Rounded at={[.007, base, 0]} size={[.255, .013, .073]} radius={.005} color="#696d64" />}
    <RepeatMeshes geometry={wheel} pieces={colors.flatMap((color, i) => {
      const x = i * .079 - .072
      return [
        part([x, base + .012, 0], [.033, .013, .033], '#606b65'),
        part([x, base + .104, 0], [.025, .008, .025], i === 1 ? '#9c7753' : '#46647a'),
      ]
    })} finish={paint} />
    <RepeatMeshes geometry={spool} pieces={colors.map((color, i) => part([i * .079 - .072, base + .013, 0], [1, .94, 1], color))}
      finish={{ roughness: .94 }} shadow={false} />
  </group>
}

function StraightStitch() {
  const body = [
    part([.010, .024, .01], [.434, .042, .191], white),
    part([-.175, .202, .073], [.063, .107, .012], '#c0c5bd'),
    part([.113, .293, -.001], [.101, .009, .058], '#6c8a8c'),
    part([.156, .153, .077], [.058, .041, .009], '#a8afa3'),
    part([.014, .260, .084], [.070, .018, .006], '#64828b'),
    ...Array.from({ length: 6 }, (_, i) => part([-.006 + i * .007, .260, .0875], [.004, .007, .001], '#cad4cf')),
    part([-.153, .046, .013], [.039, .009, .026], '#737e7c'),
    part([-.150, .048, .028], [.117, .007, .082], '#8d9b98'),
    part([-.161, .054, .027], [.036, .007, .020], '#727d79'),
    part([-.161, .056, .033], [.010, .005, .021], '#3e4743'),
    ...Array.from({ length: 4 }, (_, i) => part([-.164 + i * .004, .054, .040], [.001, .002, .021], '#555f5b')),
  ]
  return <group position={[.12, sewingTop, .048]}>
    <mesh geometry={stitchCasting} castShadow receiveShadow><meshStandardMaterial color="#d5d5c8" {...paint} /></mesh>
    <RepeatMeshes geometry={edgeBox} pieces={body} finish={paint} />
    <RepeatMeshes geometry={wheel} pieces={[
      part([.226, .224, -.005], [.061, .034, .061], '#777971', [0, 0, Math.PI / 2]),
      part([.244, .224, -.005], [.049, .013, .049], '#555a55', [0, 0, Math.PI / 2]),
      part([.171, .143, .086], [.023, .010, .023], '#7a817e', [Math.PI / 2, 0, 0]),
      part([-.157, .205, .081], [.013, .016, .013], '#353d3a', [Math.PI / 2, 0, 0]),
      part([-.178, .242, .081], [.0045, .010, .0045], '#737771', [Math.PI / 2, 0, 0]),
      part([-.179, .150, .081], [.0045, .010, .0045], '#737771', [Math.PI / 2, 0, 0]),
      part([-.159, .106, .025], [.006, .089, .006], '#7d8783'),
      part([-.161, .069, .028], [.0018, .038, .0018], '#454c4a'),
      part([-.158, .203, .096], [.009, .010, .009], '#9a9e95', [Math.PI / 2, 0, 0]),
    ]} finish={steel} />
    <ThreadRack at={[-.146, .016, -.198]} colors={['#e9e5d1']} />
    <Rod from={[-.218, .119, -.198]} to={[-.11, .267, -.033]} radius={.0013} color="#ece7da" shadow={false} />
    <Rod from={[-.11, .267, -.033]} to={[-.166, .071, .024]} radius={.0012} color="#ece7da" shadow={false} />
  </group>
}

function Overlocker() {
  return <group position={[.737, sewingTop + .008, -.003]}>
    <mesh geometry={overlockCasting} position-z={-.015} castShadow receiveShadow><meshStandardMaterial color="#d2d2c4" {...paint} /></mesh>
    <RepeatMeshes geometry={edgeBox} pieces={[
      part([0, .027, 0], [.278, .050, .215], '#aeb4a9'),
      part([.034, .080, .058], [.163, .045, .048], '#b9c0b6'),
      part([-.075, .074, .050], [.049, .021, .080], '#78847f'),
      part([-.096, .102, .054], [.034, .018, .015], '#515b56'),
      part([.122, .107, .035], [.032, .013, .030], '#9a4638'),
      part([.069, .177, .047], [.058, .012, .003], '#718b83'),
    ]} finish={paint} />
    <RepeatMeshes geometry={wheel} pieces={[-.052, -.010, .032, .074].flatMap((x, i) => [
      part([x, .140, .057], [.014, .008, .014], '#76817b', [Math.PI / 2, 0, 0]),
      part([x, .140, .065], [.010, .012, .010], ['#596b70', '#8f7761', '#586d62', '#627d80'][i], [Math.PI / 2, 0, 0]),
    ])} finish={steel} />
    <ThreadRack at={[-.015, .019, -.17]} colors={['#dcd8cb', '#e8ddc7', '#e4e3d5']} raised />
    {[-.087, -.008, .071].map((x, i) => <Rod key={x} from={[x, .356, -.166]} to={[-.052 + i * .042, .178, .034]}
      radius={.00105} color="#ddd6ba" shadow={false} />)}
  </group>
}

function SewingStation({ onInspect }) {
  const bench = [
    part([-.21, sewingTop - .019, 0], [1.24, .039, .509], '#cdcec5'),
    ...[-.835, .415].map(x => part([x, sewingTop - .018, 0], [.027, .043, .525], '#3290b7')),
    part([-.21, sewingTop - .024, .254], [1.20, .019, .004], '#a4aaa2'),
    part([-.19, .677, -.173], [1.04, .058, .045], '#bac0b5'),
    ...[-.69, .30].flatMap(x => [
      part([x, .373, -.058], [.060, .706, .072], '#c9ccc1'),
      part([x, .026, 0], [.088, .045, .458], '#d1d5c9'),
      part([x, .034, .225], [.093, .049, .045], '#3e94ba'),
    ]),
    part([-.19, .200, -.114], [1.01, .035, .045], '#afb5a8'),
    part([.21, .652, .112], [.217, .109, .208], '#b8bbb0'),
    part([.21, .656, .222], [.194, .072, .016], '#b7bcb0'),
    part([.18, .679, .234], [.075, .009, .010], '#777e74'),
    part([.737, sewingTop - .010, -.015], [.590, .035, .493], '#c5c7b9'),
    ...[.505, .968].flatMap(x => [
      part([x, .373, -.019], [.043, .706, .043], '#a5ada0'),
      part([x, .024, -.015], [.071, .039, .402], '#7c8d86'),
    ]),
    part([.737, .219, -.189], [.473, .026, .034], '#8d9a90'),
    part([.105, .089, .106], [.235, .027, .147], '#35494b', [-.22, 0, 0]),
    ...Array.from({ length: 9 }, (_, i) => part([.007 + i * .024, .103, .104], [.005, .005, .116], '#547074', [-.22, 0, 0])),
    part([-.52, sewingTop + .019, -.095], [.229, .015, .162], '#aeb6b0', [0, .19, 0]),
    part([-.53, sewingTop + .028, -.097], [.188, .012, .128], '#959892', [0, -.16, 0]),
  ]
  return <RoomItem id="left-sewing" onInspect={onInspect}>
    <group position={[-2.673, .354, 1.285]} rotation-y={Math.PI}>
      <RepeatMeshes geometry={edgeBox} pieces={bench} finish={paint} />
      <Cylinder at={[.361, .682, -.066]} radius={.062} height={.202} rotation={[0, 0, Math.PI / 2]} color="#687573" finish={steel} />
      <mesh geometry={belt}><meshStandardMaterial color="#3f4841" roughness={.88} /></mesh>
      <mesh geometry={motorCable}><meshStandardMaterial color="#41443d" roughness={.82} /></mesh>
      <mesh geometry={foldedCloth} position={[.48, sewingTop + .006, .112]} rotation-y={-.30} castShadow receiveShadow>
        <meshStandardMaterial color="#8a5d76" roughness={.95} side={DoubleSide} />
      </mesh>
      <StraightStitch />
      <Overlocker />
    </group>
  </RoomItem>
}

function FoldingChair() {
  const frame = '#c3c8c3'
  return <group position={[-2.558, .354, .687]} rotation-y={-.27}>
    {[-.156, .156].map(x => <group key={x}>
      <Rod from={[x, .025, -.201]} to={[x * .96, .557, .114]} radius={.013} color={frame} finish={steel} />
      <Rod from={[x * 1.08, .025, .229]} to={[x, .742, -.168]} radius={.012} color={frame} finish={steel} />
      <Cylinder at={[x * 1.08, .027, .224]} height={.048} radius={.017} color="#424745" />
    </group>)}
    <Rod from={[-.155, .212, .115]} to={[.155, .212, .115]} radius={.010} color={frame} finish={steel} />
    <Rod from={[-.155, .721, -.168]} to={[.155, .721, -.168]} radius={.014} color={frame} finish={steel} />
    <Rounded at={[0, .438, -.002]} size={[.347, .043, .321]} radius={.020} color="#2d546e" finish={paint} />
    <group position={[0, .681, -.160]} rotation-x={-.27}>
      <Rounded at={[0, 0, 0]} size={[.318, .192, .035]} radius={.017} color="#24475e" finish={paint} />
    </group>
  </group>
}

const paperColors = ['#ded6c3', '#b9c7bd', '#c6b497', '#e2ddcd', '#99b0b1']
const books = [
  ...Array.from({ length: 10 }, (_, i) => part([.214 + i * .001, 1.084 + .009 * i, -.132], [.22, .008, .154], paperColors[i % 5], [0, i * .18, 0])),
  ...Array.from({ length: 8 }, (_, i) => part([-.278 + i * .004, .741 + .005 * i, .041 + i * .005], [.219, .005, .146], paperColors[i % 5], [0, -.12 * i, 0])),
  ...Array.from({ length: 5 }, (_, i) => part([.269, .151 + .018 * i, -.052], [.246, .017, .153], paperColors[(i + 2) % 5], [0, -.08 * i, 0])),
  part([-.31, 1.064, -.190], [.125, .155, .014], '#c6c09b', [-.13, 0, -.12]),
  part([-.31, 1.066, -.181], [.111, .139, .012], '#e8e3cf', [-.13, 0, -.12]),
  ...Array.from({ length: 6 }, (_, i) => part([.276 - i * .007, .761 + .0038 * i, .110 - .006 * i],
    [.234 - .011 * (i % 2), .004, .153], paperColors[(i + 1) % 5], [0, -.33 + .11 * i, i === 5 ? .026 : 0])),
  ...Array.from({ length: 4 }, (_, i) => part([.236 - .010 * i, .887 + .006 * i, -.113],
    [.191, .006, .132], paperColors[i % 5], [0, .08 - .12 * i, 0])),
  ...Array.from({ length: 12 }, (_, i) => part([.278 + Math.sin(i * 2) * .016, .255 + .007 * i, .065],
    [.242 + .015 * (i % 3), .006, .204], paperColors[i % 5], [0, -.17 + (i % 4) * .105, 0])),
  ...Array.from({ length: 15 }, (_, i) => part([-.276 + Math.sin(i) * .024, .019 + .006 * i, .045 + i * .004],
    [.224 + .012 * (i % 4), .005, .192], paperColors[i % 5], [0, -.24 + i * .047, .012 * (i % 3 - 1)])),
]

function deskPaper(certificate = false) {
  return paintedTexture(256, 384, ctx => {
    ctx.fillStyle = certificate ? '#d8d1a6' : '#e3dfcf'
    ctx.fillRect(0, 0, 256, 384)
    ctx.strokeStyle = certificate ? '#92845f' : '#c4bc9f'
    ctx.lineWidth = certificate ? 3 : 1
    ctx.strokeRect(12, 13, 232, 358)
    ctx.fillStyle = '#8c7770'
    ctx.textAlign = 'center'
    ctx.font = `bold ${certificate ? 23 : 19}px serif`
    ctx.fillText(certificate ? 'GIẤY KHEN' : 'VỞ BÀI TẬP', 128, 57)
    ctx.fillStyle = '#607570'
    ctx.font = '12px serif'
    ctx.fillText(certificate ? 'CHĂM NGOAN · HỌC TỐT' : 'TÀI LIỆU HỌC TẬP', 128, 83)
    ctx.fillStyle = '#8d8a7b'
    for (let line = 0; line < 23; line++) {
      const y = 111 + line * 9
      if (!certificate && line > 5 && line < 12) continue
      ctx.fillRect(28, y, 144 + ((line * 31) % 49), line % 4 ? 1 : 2)
    }
    ctx.strokeStyle = '#a17e72'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(171, 323, 21, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(171, 323, 16, 0, Math.PI * 2); ctx.stroke()
    if (!certificate) {
      ctx.fillStyle = '#839b91'; ctx.fillRect(40, 160, 170, 60)
      ctx.fillStyle = '#d5d8c6'; ctx.fillRect(52, 172, 146, 36)
    }
  })
}

function PaperFace({ at, size, map, angle = 0, upright = false }) {
  return <mesh geometry={paperPlane} position={at} scale={[...size, 1]}
    rotation={upright ? [-.10, 0, angle] : [-Math.PI / 2, 0, angle]}>
    <meshStandardMaterial map={map} color="#e4e0cf" roughness={.90} side={DoubleSide} />
  </mesh>
}

function DeskClutter() {
  const maps = useMemo(() => ({ paper: deskPaper(), certificate: deskPaper(true), clock: paintedTexture(128, 128, ctx => {
    ctx.fillStyle = '#e4e3d4'; ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = '#526567'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#526567'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center'
    for (const [text, x, y] of [['12', 64, 28], ['3', 103, 70], ['6', 64, 110], ['9', 25, 70]]) ctx.fillText(text, x, y)
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(52, 39); ctx.moveTo(64, 64); ctx.lineTo(87, 70); ctx.stroke()
  }) }), [])
  useEffect(() => () => { Object.values(maps).forEach(map => map.dispose()) }, [maps])
  return <>
    <PaperFace at={[-.283, .782, .079]} size={[.212, .145]} map={maps.paper} angle={-.18} />
    <PaperFace at={[.218, .787, .082]} size={[.211, .151]} map={maps.paper} angle={.22} />
    <PaperFace at={[.219, 1.174, -.120]} size={[.208, .146]} map={maps.paper} angle={.19} />
    <PaperFace at={[.269, .337, .065]} size={[.24, .195]} map={maps.paper} angle={.13} />
    <PaperFace at={[-.254, .115, .089]} size={[.242, .194]} map={maps.paper} angle={-.23} />
    <PaperFace at={[-.095, 1.157, -.171]} size={[.202, .143]} map={maps.certificate} upright angle={.018} />
    <PaperFace at={[.233, 1.189, -.170]} size={[.190, .126]} map={maps.certificate} upright angle={-.02} />
    <PaperFace at={[-.330, 1.205, -.169]} size={[.160, .184]} map={maps.certificate} upright />
    <group position={[-.330, .786, -.092]}>
      <Rounded at={[0, .022, 0]} size={[.127, .024, .086]} radius={.015} color="#46a6b0" />
      <Cylinder at={[0, .068, .001]} height={.040} radius={.046} color="#70b5bc" rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={paperPlane} position={[0, .068, .022]} scale={[.071, .071, 1]}>
        <meshStandardMaterial map={maps.clock} roughness={.6} />
      </mesh>
    </group>
    <Cylinder at={[-.330, 1.089, .009]} radius={.032} top={.038} height={.067} color="#e2dfd1" />
    <RepeatMeshes pieces={[-.019, -.006, .009, .020].map((x, i) => part([-.330 + x, 1.139, .009],
      [.005, .063 + i * .005, .005], ['#6d8790', '#bd9b67', '#8b9171', '#a49079'][i], [0, 0, (i - 1) * .09]))} shadow={false} />
  </>
}

function PrintedPanel({ at, size, map, region = [0, 0, 1, 1] }) {
  const [u, v, width, height] = region
  const geometry = useMemo(() => {
    const panel = new PlaneGeometry(...size)
    const { uv } = panel.attributes
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u + uv.getX(i) * width, v + uv.getY(i) * height)
    return panel
  }, [...size, u, v, width, height])
  return <mesh geometry={geometry} position={at} receiveShadow>
    <meshStandardMaterial map={map} color="#d8d8cb" roughness={.67} envMapIntensity={.23} />
  </mesh>
}

function StudyDesk() {
  const print = useLoader(TextureLoader, deskPrintUrl)
  useMemo(() => { print.colorSpace = SRGBColorSpace; print.anisotropy = 8; print.needsUpdate = true }, [print])
  const lacquer = [
    ...[-.443, .443].map(x => part([x, .369, 0], [.037, .738, .470], blue)),
    part([.121, .37, -.025], [.028, .713, .417], '#2a7292'),
    part([.282, .134, -.015], [.316, .028, .424], '#2e7b9a'),
    part([.281, .638, .018], [.313, .136, .445], '#317f9b'),
    part([-.220, 1.101, -.092], [.027, .720, .262], '#3c829c'),
    part([-.438, 1.101, -.092], [.027, .720, .262], '#2e718c'),
    part([.441, 1.040, -.099], [.032, .601, .239], '#397e99'),
    part([-.405, 1.486, -.096], [.215, .023, .287], blue, [0, 0, Math.PI / 4]),
    part([-.262, 1.486, -.096], [.215, .023, .287], blue, [0, 0, -Math.PI / 4]),
    part([.045, 1.087, -.091], [.037, .306, .239], '#3c829c'),
    ...[.878, 1.075, 1.30].map(y => part([.095, y, -.102], [.686, .027, .238], blue)),
    ...[.998, 1.191, 1.407].map(y => part([-.330, y, -.091], [.218, .023, .266], '#3a819a')),
  ]
  return <group position={[-.48, .354, -1.09]} rotation-y={-Math.PI / 2} scale={[1, .95, 1]}>
    <RepeatMeshes geometry={edgeBox} pieces={lacquer} finish={paint} />
    <Rounded at={[0, .737, 0]} size={[.947, .041, .531]} radius={.009} color="#aa9171" />
    <Block at={[0, .727, .265]} size={[.921, .015, .005]} color="#856953" />
    <Block at={[-.004, 1.069, -.218]} size={[.898, .650, .031]} color="#a8b6a7" />
    <PrintedPanel at={[-.004, 1.069, -.201]} size={[.887, .639]} map={print} />
    <PrintedPanel at={[-.330, 1.202, -.193]} size={[.208, .389]} map={print} region={[0, .15, .24, .75]} />
    <PrintedPanel at={[.28, .646, .242]} size={[.296, .104]} map={print} region={[.66, .0, .34, .26]} />
    <Block at={[.277, .347, -.215]} size={[.325, .651, .022]} color="#557f87" />
    <mesh geometry={deskGable} position={[-.334, 1.435, .048]} scale={[1.3, 1.16, 1]} castShadow>
      <meshStandardMaterial color="#d6d0b7" map={print} roughness={.72} />
    </mesh>
    <RepeatMeshes pieces={books} finish={{ roughness: .86 }} shadow={false} />
    <DeskClutter />
    <RepeatMeshes pieces={Array.from({ length: 24 }, (_, i) => part([
      -.425 + (i % 8) * .119, [.869, 1.066, 1.291][Math.floor(i / 8)], .020,
    ], [.013 + (i % 3) * .007, .003, .004], i % 3 ? '#779ba4' : '#b2b5a0'))} shadow={false} />
    {[.187, .279, .371].map((x, i) => <PrintedPanel key={x} at={[x, .648, .249]} size={[.065, .084]}
      map={print} region={[[.035, .70, .16, .27], [.045, .015, .20, .25], [.83, .69, .15, .23]][i]} />)}
    <RepeatMeshes geometry={bead} pieces={Array.from({ length: 9 }, (_, i) =>
      part([-.195 + i * .072, 1.366, -.211], [.046, .038, .010], '#b6c6b7'))} shadow={false} />
    <Cylinder at={[.277, .651, .245]} radius={.014} height={.018} rotation={[Math.PI / 2, 0, 0]} color="#e5dec7" />
  </group>
}

export function LeftRoomWorkstations({ onInspect }) {
  return <>
    <SewingStation onInspect={onInspect} />
    <RoomItem id="left-folding-chair" onInspect={onInspect}><FoldingChair /></RoomItem>
    <RoomItem id="left-study" onInspect={onInspect}><StudyDesk /></RoomItem>
  </>
}
