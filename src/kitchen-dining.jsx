import React, { useMemo } from 'react'
import { ExtrudeGeometry, LatheGeometry, Shape, SphereGeometry, Vector2 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { randomFrom } from './surfaces.js'

const floor = .354
const tableSurface = .752
const oak = '#cf9758'
const oakLight = '#dba76a'
const oakDark = '#bc8347'
const eased = new RoundedBoxGeometry(1, 1, 1, 2, .035)
const blossomSphere = new SphereGeometry(1, 8, 6)

const vaseProfile = new LatheGeometry([
  [0, 0], [.056, 0], [.076, .048], [.079, .092], [.062, .142], [.044, .172], [.048, .182], [.039, .182], [.036, .145], [0, .14],
].map(([r, y]) => new Vector2(r, y)), 24)

const glassPuck = new LatheGeometry([
  [0, 0], [.024, 0], [.032, .012], [.034, .022], [.025, .032], [.028, .038], [0, .038],
].map(([r, y]) => new Vector2(r, y)), 18)

function roundedRectGlass(width, depth, radius, thickness) {
  const w = width / 2
  const d = depth / 2
  const r = radius
  const s = new Shape()
  s.moveTo(-w + r, -d)
  s.lineTo(w - r, -d)
  s.quadraticCurveTo(w, -d, w, -d + r)
  s.lineTo(w, d - r)
  s.quadraticCurveTo(w, d, w - r, d)
  s.lineTo(-w + r, d)
  s.quadraticCurveTo(-w, d, -w, d - r)
  s.lineTo(-w, -d + r)
  s.quadraticCurveTo(-w, -d, -w + r, -d)
  return new ExtrudeGeometry(s, { depth: thickness, bevelEnabled: true, bevelSize: .003, bevelThickness: .003, curveSegments: 10 }).rotateX(-Math.PI / 2)
}

const tableGlass = roundedRectGlass(1.42, .80, .065, .010)

function SlattedChair({ at, angle = 0, finish, backpack = false }) {
  const pieces = [
    // Front legs
    ...[-.185, .185].map(x => ({ at: [x, .218, .178], size: [.040, .436, .040], color: oak })),
    // Lower rear legs (gently splayed)
    ...[-.185, .185].map(x => ({ at: [x, .222, -.185], size: [.042, .448, .044], rotation: [-.05, 0, 0], color: oak })),
    // Upper curved backrest stiles
    ...[-.185, .185].map(x => ({ at: [x, .71, -.212], size: [.042, .55, .038], rotation: [-.09, 0, 0], color: oak })),
    // Seat & aprons
    { at: [0, .440, -.002], size: [.425, .028, .415], color: oakLight },
    { at: [0, .402, .174], size: [.35, .052, .024], color: oakDark },
    { at: [0, .402, -.178], size: [.35, .052, .024], color: oakDark },
    ...[-.182, .182].map(x => ({ at: [x, .402, 0], size: [.024, .052, .34], color: oakDark })),
    // Stretchers
    ...[-.183, .183].map(x => ({ at: [x, .135, -.004], size: [.022, .028, .35], color: oakDark })),
    { at: [0, .155, .176], size: [.35, .024, .022], color: oakDark },
    // Backrest crest rail, lower rail, and 5 vertical slats
    { at: [0, .945, -.236], size: [.395, .088, .028], rotation: [-.09, 0, 0], color: oakLight },
    { at: [0, .515, -.196], size: [.345, .032, .024], rotation: [-.08, 0, 0], color: oakDark },
    ...[-2, -1, 0, 1, 2].map(i => ({
      at: [i * .062, .728, -.216], size: [.034, .395, .014], rotation: [-.09, 0, 0], color: i % 2 ? oak : oakLight,
    })),
  ]

  return <group position={at} rotation-y={angle}>
    <RepeatMeshes geometry={eased} pieces={pieces} finish={finish} />
    {backpack && <group position={[.01, .64, -.04]} rotation={[.16, .24, -.05]}>
      <Rounded at={[0, 0, 0]} size={[.29, .37, .16]} radius={.058} color="#1d1f22" finish={{ roughness: .82 }} />
      <Rounded at={[0, -.045, .082]} size={[.24, .21, .052]} radius={.034} color="#24272a" finish={{ roughness: .85 }} />
      <Block at={[0, .078, .082]} size={[.12, .010, .005]} color="#d4d7d9" shadow={false} />
      {[-.085, .085].map(x => <Block key={x} at={[x, -.08, -.085]} size={[.036, .30, .018]} color="#17191a" />)}
    </group>}
  </group>
}

function RedBlossomVase() {
  const { twigs, petals } = useMemo(() => {
    const random = randomFrom(512)
    const branches = [
      [[0, .16, 0], [-.13, .38, .08]],
      [[0, .16, 0], [.15, .41, .06]],
      [[0, .16, 0], [-.06, .45, -.09]],
      [[0, .16, 0], [.11, .39, -.11]],
      [[0, .16, 0], [-.18, .31, -.04]],
      [[0, .16, 0], [.21, .33, .02]],
      [[0, .16, 0], [.02, .47, .05]],
      [[-.08, .29, .05], [-.21, .36, .13]],
      [[.09, .30, -.05], [.23, .36, -.12]],
    ]
    const flowers = []
    for (let i = 0; i < 44; i++) {
      const branch = branches[i % branches.length][1]
      const fx = branch[0] * (.48 + random() * .62) + (random() - .5) * .06
      const fy = .24 + (branch[1] - .16) * (.42 + random() * .66)
      const fz = branch[2] * (.48 + random() * .62) + (random() - .5) * .06
      for (let p = 0; p < 4; p++) {
        const a = p * Math.PI / 2 + random() * .4
        flowers.push({
          at: [fx + Math.cos(a) * .013, fy + (random() - .5) * .006, fz + Math.sin(a) * .013],
          size: [.016, .009, .013],
          rotation: [random(), a, random() * .5],
          color: ['#c81d25', '#db2b30', '#b31820', '#e23d3b'][(i + p) % 4],
        })
      }
      flowers.push({
        at: [fx, fy + .004, fz], size: [.007, .006, .007], rotation: [0, 0, 0], color: '#ebbf38',
      })
    }
    return { twigs: branches, petals: flowers }
  }, [])

  return <group position={[2.11, floor + tableSurface + .012, -2.97]}>
    <mesh geometry={vaseProfile} castShadow receiveShadow>
      <meshStandardMaterial color="#4a3328" roughness={.26} envMapIntensity={.72} />
    </mesh>
    {[.052, .088, .122].map(y => <Cylinder key={y} at={[0, y, 0]} height={.004} radius={y === .088 ? .080 : .071} color="#9c8572" shadow={false} />)}
    {twigs.map(([from, to], idx) => <Rod key={idx} from={from} to={to} radius={.0035} taper={.45} color="#3d2922" shadow={false} />)}
    <RepeatMeshes geometry={blossomSphere} pieces={petals} finish={{ roughness: .58 }} shadow={false} />
  </group>
}

function TabletopItems() {
  const topY = floor + tableSurface + .012
  return <group>
    <RedBlossomVase />
    {/* Mint-turquoise insulated tumbler with lid & straw */}
    <group position={[1.74, topY, -3.19]}>
      <Cylinder at={[0, .086, 0]} height={.172} radius={.036} top={.042} color="#58c4be" finish={{ roughness: .28 }} />
      <Cylinder at={[0, .180, 0]} height={.020} radius={.043} top={.041} color="#9be0dc" finish={{ roughness: .22 }} />
      <Rod from={[0, .185, 0]} to={[-.038, .245, .02]} radius={.0035} color="#e5ecec" shadow={false} />
    </group>
    {/* Small bottle with blue cap next to tumbler */}
    <group position={[1.66, topY, -3.24]}>
      <Cylinder at={[0, .052, 0]} height={.104} radius={.021} top={.015} color="#e5d5be" />
      <Cylinder at={[0, .045, 0]} height={.038} radius={.022} color="#c54c38" />
      <Cylinder at={[0, .110, 0]} height={.014} radius={.012} color="#2874ba" />
    </group>
    {/* Yellow plastic condiment/medicine basket */}
    <group position={[1.91, topY, -3.12]} rotation-y={.24}>
      <Rounded at={[0, .026, 0]} size={[.165, .052, .125]} radius={.010} color="#d6a534" finish={{ roughness: .44 }} />
      <Block at={[0, .050, 0]} size={[.14, .012, .10]} color="#423b32" shadow={false} />
      <Cylinder at={[-.035, .062, .01]} height={.045} radius={.016} color="#2c2a28" />
      <Block at={[.03, .060, -.01]} size={[.052, .032, .042]} color="#ebe7dc" shadow={false} />
    </group>
    {/* Black TV remote */}
    <Rounded at={[2.05, topY + .008, -3.16]} size={[.044, .015, .155]} radius={.005} angle={1.18} color="#202221" />
    {/* Kraft bag / parcel near right end */}
    <Rounded at={[2.30, topY + .058, -2.93]} size={[.19, .115, .14]} radius={.012} angle={-.18} color="#b5946d" finish={{ roughness: .85 }} />
  </group>
}

export function KitchenDining({ surfaces, onInspect }) {
  const oakFinish = useMemo(() => ({
    normalMap: surfaces.wood.normalMap,
    normalScale: surfaces.wood.normalScale,
    roughness: .33,
    envMapIntensity: .52,
  }), [surfaces.wood])
  const cx = 1.88
  const cz = -3.08

  const tableFrame = [
    // 4 thick square chamfered legs
    ...[-.58, .58].flatMap(x => [-.29, .29].map(z => ({
      at: [x, .352, z], size: [.082, .704, .082], color: oak,
    }))),
    // Bottom end stretchers
    ...[-.58, .58].map(x => ({ at: [x, .12, 0], size: [.044, .048, .52], color: oakDark })),
    // Upper aprons
    ...[-.285, .285].map(z => ({ at: [0, .635, z], size: [1.10, .082, .032], color: oakDark })),
    ...[-.58, .58].map(x => ({ at: [x, .635, 0], size: [.032, .082, .52], color: oakDark })),
    // Wooden sub-top & lower shelf
    { at: [0, .695, 0], size: [1.26, .030, .66], color: oakLight },
    { at: [0, .575, 0], size: [1.10, .022, .53], color: oak },
  ]

  return <RoomItem id="dining-set" onInspect={onInspect}>
    <group position={[cx, floor, cz]}>
      <RepeatMeshes geometry={eased} pieces={tableFrame} finish={oakFinish} />
      {/* Turned wooden risers holding the glass top */}
      {[-.55, .55].flatMap(x => [-.26, .26].map(z =>
        <mesh key={`${x}:${z}`} geometry={glassPuck} position={[x, .710, z]} castShadow>
          <meshStandardMaterial color={oakLight} {...oakFinish} />
        </mesh>
      ))}
      {/* Items stored on the under-table shelf */}
      <Block at={[-.18, .598, .12]} size={[.24, .028, .17]} color="#d8b23c" angle={.08} shadow={false} />
      <Block at={[.16, .592, .10]} size={[.28, .014, .19]} color="#e7e4dc" angle={-.12} shadow={false} />
      {/* Tempered beveled glass tabletop */}
      <mesh geometry={tableGlass} position={[0, tableSurface, 0]} receiveShadow>
        <meshPhysicalMaterial color="#a8c0b4" transparent opacity={.52} roughness={.09} metalness={.06}
          clearcoat={.85} clearcoatRoughness={.08} envMapIntensity={1.15} />
      </mesh>
      {/* Small Roya cardboard box, dark pipe & red bag under the table */}
      <Rounded at={[-.43, .105, .02]} size={[.28, .21, .24]} radius={.006} angle={.26} color="#bfa27c" finish={{ roughness: .85 }} />
      <Rod from={[-.55, .018, .22]} to={[-.22, .018, .08]} radius={.016} color="#34383b" />
      <Rounded at={[-.08, .065, .06]} size={[.23, .12, .19]} radius={.042} angle={-.3} color="#b92f34" finish={{ roughness: .65 }} />
    </group>

    {/* 4 honey-oak slatted chairs in exact photo positions */}
    <SlattedChair at={[1.20, floor, -3.00]} angle={Math.PI / 2} finish={oakFinish} />
    <SlattedChair at={[1.53, floor, -2.53]} angle={2.98} finish={oakFinish} backpack />
    <SlattedChair at={[2.14, floor, -2.59]} angle={Math.PI} finish={oakFinish} />
    <SlattedChair at={[2.18, floor, -3.54]} angle={0} finish={oakFinish} />

    <TabletopItems />
  </RoomItem>
}
