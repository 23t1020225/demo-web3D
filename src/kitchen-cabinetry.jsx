import React, { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { CatmullRomCurve3, CylinderGeometry, DoubleSide, LatheGeometry, SRGBColorSpace, TextureLoader, TubeGeometry, Vector2, Vector3 } from 'three'
import { Block, Cylinder, RepeatMeshes, Rod, Rounded } from './model-parts.jsx'
import { RoomItem } from './room-furnishings.jsx'
import { paintedTexture, randomFrom } from './surfaces.js'
import fridgeUpperUrl from './assets/rear/fridge-upper.webp'
import fridgeLowerUrl from './assets/rear/fridge-lower.webp'

const fridgePhotoUrls = [fridgeLowerUrl, fridgeUpperUrl]

const floor = .354
const counterTop = 1.13
const redFrame = '#9b503b'
const oakPanel = ['#a96d49', '#a46845', '#a06442']
const whitePanel = '#e2e2da'
const granite = { roughness: .27, metalness: .08, envMapIntensity: .50 }
const chrome = { roughness: .20, metalness: .78, envMapIntensity: .92 }
const brushedSteel = { roughness: .28, metalness: .68, envMapIntensity: .82 }
const darkGlass = { roughness: .27, metalness: .12, envMapIntensity: .45 }
const cylinder = new CylinderGeometry(1, 1, 1, 20)

function tube(points, radius, segments = 20) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), segments, radius, 8, false)
}

const sinkFaucet = tube([
  [2.83, 1.14, -4.89], [2.83, 1.33, -4.89], [2.80, 1.42, -4.88],
  [2.71, 1.45, -4.84], [2.64, 1.41, -4.81], [2.62, 1.35, -4.80],
], .014, 24)

const drainTrap = tube([
  [2.64, .93, -4.97], [2.64, .78, -4.95], [2.66, .71, -4.86],
  [2.65, .76, -4.74], [2.64, .93, -4.65],
], .019, 24)

const drainOut = tube([
  [2.66, .73, -4.81], [2.76, .69, -4.77], [2.91, .64, -4.74],
], .021, 14)

const dispenserCord = tube([
  [2.82, 1.12, -3.77], [2.88, 1.16, -3.66], [2.90, 1.38, -3.59], [2.91, 1.65, -3.55],
], .004, 18)

const cookerCord = tube([
  [2.19, 1.22, -6.18], [2.17, 1.26, -6.27], [2.15, 1.34, -6.31],
], .004, 12)

const wasteBasket = new LatheGeometry([
  [0, 0], [.105, 0], [.134, .28], [.142, .30], [.130, .30], [.100, .015], [0, .015],
].map(([r, y]) => new Vector2(r, y)), 22)

const waterBucket = new LatheGeometry([
  [0, 0], [.112, 0], [.138, .29], [.144, .31], [.134, .31], [.108, .015], [0, .015],
].map(([r, y]) => new Vector2(r, y)), 22)

function tapCurve(zOffset) {
  return tube([
    [0, 0, zOffset], [0, .145, zOffset], [-.022, .178, zOffset], [-.058, .168, zOffset], [-.066, .138, zOffset],
  ], .0065, 18)
}
const leftTap = tapCurve(-.058)
const rightTap = tapCurve(.058)

function CabinetDoor({ at, width, height = .665, angle = 0, white = false, woodFinish, shade = 0, ajar = 0 }) {
  const frame = [
    ...[-1, 1].map(s => ({ at: [s * (width / 2 - .021), 0, 0], size: [.042, height, .022], color: redFrame })),
    ...[-1, 1].map(s => ({ at: [0, s * (height / 2 - .022), 0], size: [width - .08, .044, .022], color: redFrame })),
  ]
  return <group position={at} rotation-y={angle}>
    <group position={[-width / 2, 0, 0]} rotation-y={ajar}>
      <group position={[width / 2, 0, 0]}>
        <RepeatMeshes pieces={frame} finish={woodFinish} />
        <Block at={[0, 0, -.002]} size={[width - .078, height - .082, .014]}
          color={white ? whitePanel : oakPanel[shade % oakPanel.length]}
          finish={white ? { roughness: .32 } : woodFinish} />
        <Rounded at={[-width / 2 + .034, .02, .016]} size={[.010, .078, .014]} radius={.003} color="#3a332d" />
      </group>
    </group>
  </group>
}

function TaoShrine() {
  const lamps = [-.185, .185]
  return <group position={[1.82, 1.84, -6.245]}>
    <Rounded at={[0, 0, 0]} size={[.49, .018, .155]} radius={.005} color="#8e4333" />
    {[-.18, .18].map(x => <Block key={x} at={[x, -.032, -.045]} size={[.022, .052, .065]} color="#7a3a2c" />)}
    {lamps.map(x => <group key={x} position={[x, .01, .005]}>
      <Cylinder at={[0, .022, 0]} height={.042} radius={.026} top={.018} color="#c5963e" finish={{ metalness: .55, roughness: .35 }} />
      <Rod from={[0, .04, 0]} to={[0, .24, 0]} radius={.007} color="#3d6b3c" />
      {[.10, .16, .22].map((y, i) => <Cylinder key={y} at={[(i - 1) * .012, y, .006]} height={.028} radius={.014} top={.024}
        color={i === 1 ? '#e2a83b' : '#c9332b'} finish={{ emissive: '#b82921', emissiveIntensity: .18, roughness: .4 }} />)}
    </group>)}
    <Cylinder at={[0, .032, .005]} height={.046} radius={.032} top={.036} color="#dfd8c8" />
    {[-.07, .07].map(x => <Cylinder key={x} at={[x, .021, .022]} height={.026} radius={.016} color="#c2483c" />)}
  </group>
}

function SpiceShelf({ woodFinish }) {
  const boards = [
    ...[-.165, .165].map(x => ({ at: [x, .24, 0], size: [.018, .48, .155], color: '#c89b6c' })),
    ...[.02, .19, .35, .47].map(y => ({ at: [0, y, 0], size: [.315, .016, .150], color: '#cfa374' })),
    { at: [0, .24, -.072], size: [.33, .46, .008], color: '#bfa07a' },
  ]
  const jars = [
    { at: [-.09, .075, .01], size: [.042, .092, .042], color: '#dfd9cc' },
    { at: [-.02, .085, .01], size: [.038, .112, .038], color: '#7a3f28' },
    { at: [.06, .070, .01], size: [.046, .082, .046], color: '#d8cfb8' },
    { at: [-.08, .245, .01], size: [.040, .090, .040], color: '#c94f38' },
    { at: [.01, .252, .01], size: [.044, .105, .044], color: '#e6e1d5' },
    { at: [.09, .238, .01], size: [.036, .078, .036], color: '#ba8c4e' },
  ]
  return <group position={[2.47, counterTop, -6.22]}>
    <RepeatMeshes pieces={boards} finish={woodFinish} />
    <RepeatMeshes geometry={cylinder} pieces={jars} finish={{ roughness: .35 }} shadow={false} />
    <Cylinder at={[-.09, .51, 0]} height={.065} radius={.036} top={.044} color="#4d3d33" />
    <RepeatMeshes pieces={Array.from({ length: 14 }, (_, i) => {
      const a = i * .9
      return {
        at: [-.09 + Math.cos(a) * .032, .565 + (i % 3) * .018, Math.sin(a) * .032],
        size: [.032, .018, .016], rotation: [.3, a, .2], color: i % 2 ? '#3f6a37' : '#557f44',
      }
    })} shadow={false} />
    <Cylinder at={[.05, .515, .01]} height={.074} radius={.026} color="#e7e4dc" />
  </group>
}

function StoveAppliances() {
  return <group>
    {/* Yellow dish soap bottle at far left */}
    <Cylinder at={[1.20, counterTop + .068, -5.84]} height={.135} radius={.029} top={.021} color="#e2be2b" finish={{ roughness: .26 }} />
    <Cylinder at={[1.20, counterTop + .146, -5.84]} height={.024} radius={.011} color="#d8d8d0" />
    {/* Plastic jar & olive-green sack in gap between fridge and stove cabinet */}
    <Cylinder at={[1.09, floor + .125, -5.80]} height={.25} radius={.074} color="#4e5450" finish={{ transparent: true, opacity: .66, roughness: .22 }} />
    <Cylinder at={[1.09, floor + .258, -5.80]} height={.026} radius={.054} color="#6b253f" />
    <Rounded at={[1.08, floor + .12, -5.98]} size={[.14, .18, .18]} radius={.036} color="#cdcfc8" />
    <Rounded at={[1.08, floor + .29, -5.94]} size={[.15, .18, .22]} radius={.052} color="#586b3d" />

    {/* Built-in double glass stove */}
    <Rounded at={[1.64, counterTop + .012, -6.02]} size={[.62, .022, .41]} radius={.010} color="#171a19" finish={darkGlass} />
    {[1.48, 1.80].map((x, idx) => <group key={x} position={[x, counterTop + .024, -6.03]}>
      <Cylinder at={[0, .008, 0]} height={.016} radius={.082} color="#3a3d3b" finish={brushedSteel} />
      <Cylinder at={[0, .068, 0]} height={.108} radius={idx === 0 ? .092 : .084} color="#cfd4d2" finish={chrome} />
      <Cylinder at={[0, .128, 0]} height={.018} radius={idx === 0 ? .095 : .087} top={.05} color="#d7dcda" finish={chrome} />
      <Cylinder at={[0, .144, 0]} height={.016} radius={.015} color="#262826" />
      {[-1, 1].map(s => <Block key={s} at={[s * (idx === 0 ? .108 : .098), .088, 0]} size={[.022, .012, .048]} color="#2c2e2d" />)}
    </group>)}
    {/* Tilted shiny pot lid between burners */}
    <group position={[1.64, counterTop + .085, -6.06]} rotation={[.42, .2, -.35]}>
      <Cylinder at={[0, 0, 0]} height={.014} radius={.084} top={.045} color="#dadfdd" finish={chrome} />
    </group>

    {/* Electric kettle */}
    <group position={[2.01, counterTop, -6.03]}>
      <Cylinder at={[0, .010, 0]} height={.020} radius={.072} color="#252726" />
      <Cylinder at={[0, .098, 0]} height={.158} radius={.068} top={.054} color="#d4d9d7" finish={chrome} />
      <Cylinder at={[0, .182, 0]} height={.018} radius={.055} color="#262827" />
      <Block at={[.068, .105, 0]} size={[.022, .115, .018]} color="#252726" />
    </group>

    {/* Cylindrical black & silver rice cooker */}
    <group position={[2.22, counterTop, -6.04]}>
      <Cylinder at={[0, .095, 0]} height={.185} radius={.112} color="#1f2120" finish={{ roughness: .24, metalness: .22 }} />
      <Cylinder at={[0, .192, 0]} height={.026} radius={.110} top={.098} color="#cfd3d0" finish={brushedSteel} />
      <Rounded at={[0, .095, .110]} size={[.064, .082, .012]} radius={.004} color="#c8cbc6" />
      <Rounded at={[0, .212, 0]} size={[.13, .018, .036]} radius={.006} color="#262827" />
    </group>
    {/* Wall socket & rice cooker cord */}
    <Rounded at={[2.15, 1.35, -6.312]} size={[.065, .095, .012]} radius={.004} color="#eceae2" />
    <Block at={[2.15, 1.34, -6.303]} size={[.018, .022, .014]} color="#232524" />
    <mesh geometry={cookerCord}><meshStandardMaterial color="#252725" roughness={.7} /></mesh>
  </group>
}

function SinkArea() {
  return <group>
    {/* Stainless steel double sink rim & bowls */}
    <Rounded at={[2.64, counterTop + .005, -4.81]} size={[.44, .012, .78]} radius={.005} color="#c5ccca" finish={brushedSteel} />
    {[-4.99, -4.63].map(z => <group key={z} position={[2.64, counterTop - .09, z]}>
      <Rounded at={[0, 0, 0]} size={[.36, .175, .33]} radius={.022} color="#adb5b3" finish={brushedSteel} />
      <Block at={[0, .092, 0]} size={[.34, .012, .31]} color="#535a59" shadow={false} />
      <Cylinder at={[0, .005, 0]} height={.010} radius={.032} color="#68706e" finish={chrome} />
    </group>)}
    <mesh geometry={sinkFaucet} castShadow><meshStandardMaterial color="#d6dcda" {...chrome} /></mesh>
    <Cylinder at={[2.83, counterTop + .022, -4.81]} height={.038} radius={.014} color="#cfd6d4" finish={chrome} />
    {/* Upright silver splash tray leaning behind faucet */}
    <Rounded at={[2.87, counterTop + .165, -4.77]} size={[.016, .31, .46]} radius={.007} color="#c3c8c5"
      finish={{ roughness: .32, metalness: .35 }} />
    {/* Dish soap bottles & bowls by sink */}
    <Cylinder at={[2.76, counterTop + .085, -5.23]} height={.165} radius={.028} top={.016} color="#2c7ec2" />
    <Cylinder at={[2.71, counterTop + .078, -5.16]} height={.150} radius={.027} top={.015} color="#eb6a2a" />
    <Cylinder at={[2.56, counterTop + .028, -5.27]} height={.052} radius={.058} top={.068} color="#efede6" />
    <Cylinder at={[2.54, counterTop + .026, -5.52]} height={.048} radius={.075} top={.092} color="#c88c4b" />

    {/* Under-sink plumbing, pink basket & white/pink bucket */}
    <mesh geometry={drainTrap}><meshStandardMaterial color="#7d8380" roughness={.52} /></mesh>
    <mesh geometry={drainOut}><meshStandardMaterial color="#767c79" roughness={.55} /></mesh>
    <group position={[2.61, floor + .032, -4.95]}>
      <mesh geometry={wasteBasket} castShadow><meshStandardMaterial color="#cb4d68" roughness={.48} side={DoubleSide} /></mesh>
      <Rounded at={[0, .28, 0]} size={[.19, .08, .18]} radius={.035} color="#eceae2" />
    </group>
    <group position={[2.63, floor + .032, -4.65]}>
      <mesh geometry={waterBucket} castShadow><meshStandardMaterial color="#cb4b78" roughness={.42} side={DoubleSide} /></mesh>
      <Cylinder at={[0, .255, 0]} height={.095} radius={.136} top={.145} color="#eae8e1" />
    </group>
  </group>
}

function FloralKitchenMat() {
  const mat = useMemo(() => paintedTexture(512, 192, ctx => {
    ctx.fillStyle = '#c8baa3'
    ctx.fillRect(0, 0, 512, 192)
    ctx.fillStyle = '#3b2920'
    ctx.fillRect(10, 10, 492, 172)
    for (const [cx, cy, r] of [[115, 98, 72], [275, 92, 78], [420, 102, 66]]) {
      for (let p = 0; p < 14; p++) {
        const a = p * Math.PI / 7
        ctx.save()
        ctx.translate(cx + Math.cos(a) * r * .46, cy + Math.sin(a) * r * .44)
        ctx.rotate(a)
        ctx.fillStyle = p % 2 ? '#ede5d5' : '#dfd4bf'
        ctx.beginPath()
        ctx.ellipse(0, 0, r * .46, r * .17, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.fillStyle = '#b9893d'
      ctx.beginPath()
      ctx.arc(cx, cy, r * .18, 0, Math.PI * 2)
      ctx.fill()
    }
  }), [])
  useEffect(() => () => mat.dispose(), [mat])
  return <>
    <mesh position={[1.92, floor + .003, -5.48]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[.96, .42]} />
      <meshStandardMaterial map={mat} roughness={.88} />
    </mesh>
    {/* Crumpled dark floor cloth in front of sink */}
    <group position={[1.98, floor, -4.86]} rotation-y={.24}>
      <Rounded at={[0, .011, 0]} size={[.21, .018, .13]} radius={.009} angle={.18} color="#484a42" finish={{ roughness: .94 }} />
      <Rounded at={[-.05, .020, .02]} size={[.12, .026, .09]} radius={.012} angle={-.35} color="#55574e" finish={{ roughness: .94 }} />
      <Rounded at={[.06, .018, -.02]} size={[.11, .022, .08]} radius={.010} angle={.52} color="#3d3f38" finish={{ roughness: .94 }} />
    </group>
  </>
}

function WaterDispenser({ onInspect }) {
  const front = useMemo(() => paintedTexture(256, 768, ctx => {
    const g = ctx.createLinearGradient(0, 0, 256, 768)
    g.addColorStop(0, '#222628')
    g.addColorStop(.5, '#191c1e')
    g.addColorStop(1, '#141718')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 768)
    ctx.fillStyle = '#bca06f'
    ctx.fillRect(14, 54, 228, 6)
    ctx.fillStyle = '#cfd4d2'
    ctx.fillRect(98, 22, 60, 14)
    ctx.fillRect(108, 138, 40, 10)
    ctx.strokeStyle = 'rgba(200,208,210,.22)'
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(18, 520 + i * 38)
      ctx.lineTo(128, 465 + i * 38)
      ctx.lineTo(238, 520 + i * 38)
      ctx.stroke()
    }
  }), [])
  useEffect(() => () => front.dispose(), [front])

  return <>
    <RoomItem id="water-dispenser" onInspect={onInspect}>
      <group position={[2.70, floor, -3.93]} rotation-y={-Math.PI / 2}>
        <Rounded at={[0, .495, 0]} size={[.32, .96, .33]} radius={.012} color="#1c2022" finish={{ roughness: .24, metalness: .2 }} />
        <mesh position={[0, .495, .167]}>
          <planeGeometry args={[.308, .945]} />
          <meshStandardMaterial map={front} roughness={.13} metalness={.18} envMapIntensity={.95} />
        </mesh>
        {[-.12, .12].flatMap(x => [-.12, .12].map(z =>
          <Cylinder key={`${x}:${z}`} at={[x, .012, z]} height={.024} radius={.018} color="#171919" />
        ))}
        {/* Top chrome taps & glass cups */}
        <group position={[0, .975, .02]} rotation-y={Math.PI / 2}>
          <mesh geometry={leftTap}><meshStandardMaterial color="#dadfda" {...chrome} /></mesh>
          <mesh geometry={rightTap}><meshStandardMaterial color="#dadfda" {...chrome} /></mesh>
        </group>
        {[-.08, .08].map(x => <Cylinder key={x} at={[x, 1.005, -.05]} height={.058} radius={.026} top={.031}
          color="#dce8ea" finish={{ transparent: true, opacity: .36, roughness: .12 }} />)}
      </group>
      <Rounded at={[2.915, 1.66, -3.55]} size={[.014, .095, .062]} radius={.004} color="#eceae2" />
      <mesh geometry={dispenserCord}><meshStandardMaterial color="#2a2d2b" roughness={.72} /></mesh>
    </RoomItem>
    {/* Mikku cardboard carton box beside water dispenser */}
    <group position={[2.61, floor, -3.55]} rotation-y={.06}>
      <Rounded at={[0, .095, 0]} size={[.34, .19, .24]} radius={.008} color="#c39367" finish={{ roughness: .82 }} />
      <Block at={[0, .092, .121]} size={[.32, .15, .004]} color="#b5483c" shadow={false} />
      <Block at={[-.171, .092, 0]} size={[.004, .15, .22]} color="#b5483c" shadow={false} />
    </group>
  </>
}

function AquaFridge({ onInspect }) {
  const [lowerDoor, upperDoor] = useLoader(TextureLoader, fridgePhotoUrls)
  useMemo(() => {
    for (const map of [lowerDoor, upperDoor]) { map.colorSpace = SRGBColorSpace; map.anisotropy = 8 }
  }, [lowerDoor, upperDoor])

  return <RoomItem id="fridge" onInspect={onInspect}>
    <group position={[.78, floor, -6.02]}>
      {/* Main fridge body */}
      <Rounded at={[0, .69, -.02]} size={[.50, 1.34, .53]} radius={.018} color="#59615e"
        finish={{ roughness: .39, metalness: .20, envMapIntensity: .32 }} />
      {/* Lower door */}
      <Rounded at={[0, .455, .258]} size={[.496, .84, .038]} radius={.012} color="#2a2e32"
        finish={{ roughness: .34, metalness: .20, envMapIntensity: .36 }} />
      <mesh position={[0, .455, .279]}>
        <planeGeometry args={[.476, .815]} />
        <meshStandardMaterial map={lowerDoor} roughness={.33} metalness={.12} envMapIntensity={.30} />
      </mesh>
      {/* Upper freezer door */}
      <Rounded at={[0, 1.12, .258]} size={[.496, .45, .038]} radius={.012} color="#2c3034"
        finish={{ roughness: .34, metalness: .20, envMapIntensity: .36 }} />
      <mesh position={[0, 1.12, .279]}>
        <planeGeometry args={[.476, .425]} />
        <meshStandardMaterial map={upperDoor} roughness={.33} metalness={.12} envMapIntensity={.30} />
      </mesh>
      {/* Left vertical pocket handles */}
      <Rounded at={[-.222, 1.11, .282]} size={[.026, .28, .026]} radius={.006} color="#464b4f" finish={brushedSteel} />
      <Rounded at={[-.222, .66, .282]} size={[.026, .32, .026]} radius={.006} color="#464b4f" finish={brushedSteel} />
      {/* Pink round side sticker & small colorful items on top */}
      <mesh position={[.252, 1.24, .16]} rotation-y={Math.PI / 2}>
        <circleGeometry args={[.032, 20]} />
        <meshStandardMaterial color="#d87a6e" roughness={.4} />
      </mesh>
      <Rounded at={[-.03, 1.375, .14]} size={[.045, .028, .036]} radius={.012} color="#d96b3b" />
      <Rounded at={[.02, 1.378, .15]} size={[.048, .032, .038]} radius={.014} color="#2b8c6e" />
      {/* Feet */}
      {[-.19, .19].flatMap(x => [-.20, .22].map(z =>
        <Cylinder key={`${x}:${z}`} at={[x, .014, z]} height={.028} radius={.024} color="#171819" />
      ))}
      {/* Rolled mat in the gap between fridge and stove cabinet */}
      <Cylinder at={[.285, .17, .05]} height={.34} radius={.034} color="#4b6b58" />
      <Cylinder at={[.285, .33, .05]} height={.022} radius={.035} color="#b9423b" />
    </group>
  </RoomItem>
}

export function KitchenCabinetry({ surfaces, onInspect }) {
  const woodFinish = useMemo(() => ({ ...surfaces.redWood, roughness: .42, envMapIntensity: .55 }), [surfaces.redWood])

  // Stove front stiles & rails (x = 1.16 to 2.36, z = -5.76)
  const stoveFrame = [
    { at: [1.76, floor + .024, -5.76], size: [1.232, .048, .036], color: redFrame },
    { at: [1.76, counterTop - .036, -5.76], size: [1.232, .044, .036], color: redFrame },
    ...[0, 1, 2, 3, 4, 5].map(i => ({
      at: [1.16 + i * .24, .74, -5.76], size: [.030, .75, .036], color: redFrame,
    })),
  ]

  // Sink front stiles & rails (x = 2.36, z = -5.75 to -4.24)
  const sinkFrame = [
    { at: [2.36, floor + .024, -4.995], size: [.036, .048, 1.51], color: redFrame },
    { at: [2.36, counterTop - .036, -4.995], size: [.036, .044, 1.51], color: redFrame },
    ...[-5.75, -5.40, -5.05, -4.56, -4.24].map(z => ({
      at: [2.36, .74, z], size: [.036, .75, .034], color: redFrame,
    })),
  ]

  return <>
    <RoomItem id="stove" onInspect={onInspect}>
      {/* Masonry cheeks, dark interior cavities & open-bay pots */}
      <Block at={[1.146, .735, -6.04]} size={[.030, .76, .57]} color="#dfe0d8" finish={surfaces.plaster} />
      <Block at={[2.04, .73, -6.06]} size={[1.76, .74, .53]} color="#252220" shadow={false} />
      {/* Open stove bay #2 cavity & stacked black pots */}
      <Block at={[1.52, .73, -6.02]} size={[.216, .68, .50]} color="#191817" shadow={false} />
      <Block at={[1.52, .68, -6.00]} size={[.214, .018, .46]} color="#53453c" />
      <Cylinder at={[1.52, .45, -5.94]} height={.11} radius={.076} color="#232524" finish={brushedSteel} />
      <Cylinder at={[1.52, .75, -5.95]} height={.09} radius={.070} color="#282a29" finish={brushedSteel} />

      {/* Black granite countertops (cut out around double sink) */}
      <Rounded at={[2.04, counterTop, -6.035]} size={[1.81, .030, .595]} radius={.006} color="#151717" finish={granite} />
      <Rounded at={[2.645, counterTop, -5.475]} size={[.59, .030, .55]} radius={.006} color="#151717" finish={granite} />
      <Rounded at={[2.645, counterTop, -4.325]} size={[.59, .030, .21]} radius={.006} color="#151717" finish={granite} />
      <Block at={[2.395, counterTop, -4.81]} size={[.09, .030, .79]} color="#151717" finish={granite} />
      <Block at={[2.89, counterTop, -4.81]} size={[.09, .030, .79]} color="#151717" finish={granite} />

      {/* Stove cabinet doors (1 white, 1 open, 3 wood-grain) */}
      <RepeatMeshes pieces={stoveFrame} finish={woodFinish} />
      <CabinetDoor at={[1.28, .74, -5.752]} width={.214} white woodFinish={woodFinish} ajar={.08} />
      {[0, 1, 2].map(i =>
        <CabinetDoor key={i} at={[1.76 + i * .24, .74, -5.752]} width={.214} shade={i} woodFinish={woodFinish} />
      )}

      {/* Sink cabinet framing & closed doors */}
      <Block at={[2.645, .735, -4.235]} size={[.57, .76, .032]} color="#dfe0d8" finish={surfaces.plaster} />
      <RepeatMeshes pieces={sinkFrame} finish={woodFinish} />
      <CabinetDoor at={[2.352, .74, -5.575]} width={.324} angle={-Math.PI / 2} woodFinish={woodFinish} />
      <CabinetDoor at={[2.352, .74, -5.225]} width={.324} angle={-Math.PI / 2} white woodFinish={woodFinish} />
      <CabinetDoor at={[2.352, .74, -4.40]} width={.295} angle={-Math.PI / 2} white woodFinish={woodFinish} />

      <StoveAppliances />
      <SpiceShelf woodFinish={woodFinish} />
      <TaoShrine />
    </RoomItem>

    <RoomItem id="sink" onInspect={onInspect}>
      {/* Open under-sink cavity walls & floor */}
      <Block at={[2.65, floor + .018, -4.81]} size={[.54, .032, .48]} color="#cfc9bc" />
      <Block at={[2.65, .74, -5.04]} size={[.52, .70, .02]} color="#bdb8ab" />
      <Block at={[2.65, .74, -4.57]} size={[.52, .70, .02]} color="#bdb8ab" />
      <SinkArea />
    </RoomItem>

    <RoomItem id="kitchen-mat" onInspect={onInspect}>
      <FloralKitchenMat />
    </RoomItem>

    <WaterDispenser onInspect={onInspect} />
    <AquaFridge onInspect={onInspect} />
  </>
}
