import { CatmullRomCurve3, Color, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const wood = '#b86e4d'
const frame = '#a25a3c'
const edge = '#b36545'
const inset = '#af694a'
const cut = '#8c4b31'
const raised = '#a85f40'

function profile(draw, depth, bevel = .009) {
  const outline = new Shape()
  draw(outline)
  const geometry = new ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 8 }).translate(0, 0, -depth / 2)
  const { uv } = geometry.attributes
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 + uv.getX(i) * .87, .14 + uv.getY(i) * .74)
  return geometry
}

const crest = profile(s => {
  s.moveTo(-.129, .919)
  s.bezierCurveTo(-.130, .982, -.153, 1.008, -.195, 1.045)
  s.quadraticCurveTo(-.204, 1.063, -.188, 1.077)
  s.quadraticCurveTo(0, 1.085, .188, 1.077)
  s.quadraticCurveTo(.204, 1.063, .195, 1.045)
  s.bezierCurveTo(.153, 1.008, .130, .982, .129, .919)
}, .071, .012)

const stile = profile(s => {
  s.moveTo(-.144, .503)
  s.bezierCurveTo(-.125, .626, -.118, .778, -.129, .968)
  s.quadraticCurveTo(0, .987, .129, .968)
  s.bezierCurveTo(.118, .778, .125, .626, .144, .503)
  s.quadraticCurveTo(0, .484, -.144, .503)
}, .078, .012)

const panel = profile(s => {
  s.moveTo(-.106, .535)
  s.bezierCurveTo(-.091, .641, -.089, .802, -.100, .934)
  s.quadraticCurveTo(0, .927, .100, .934)
  s.bezierCurveTo(.089, .802, .091, .641, .106, .535)
  s.quadraticCurveTo(0, .527, -.106, .535)
}, .014, .007)

const wing = profile(s => {
  s.moveTo(.128, .493)
  s.lineTo(.235, .493)
  s.lineTo(.237, .544)
  s.quadraticCurveTo(.264, .556, .241, .588)
  s.bezierCurveTo(.286, .598, .267, .634, .248, .640)
  s.bezierCurveTo(.278, .658, .274, .688, .249, .698)
  s.quadraticCurveTo(.276, .723, .249, .747)
  s.quadraticCurveTo(.269, .761, .254, .779)
  s.lineTo(.270, .779)
  s.lineTo(.270, .842)
  s.lineTo(.227, .842)
  s.lineTo(.227, .866)
  s.lineTo(.190, .866)
  s.lineTo(.190, .887)
  s.lineTo(.119, .887)
}, .052, .007)

const lowerRail = profile(s => {
  s.moveTo(-.279, .378)
  s.lineTo(.279, .378)
  s.lineTo(.279, .464)
  s.quadraticCurveTo(.265, .497, .230, .513)
  s.quadraticCurveTo(0, .493, -.230, .513)
  s.quadraticCurveTo(-.265, .497, -.279, .464)
}, .081)

const seatFoot = profile(s => {
  s.moveTo(-.077, .276)
  s.lineTo(.055, .276)
  s.bezierCurveTo(.082, .258, .111, .215, .119, .177)
  s.bezierCurveTo(.135, .124, .115, .046, .087, .010)
  s.lineTo(.028, .010)
  s.bezierCurveTo(.007, .021, .057, .085, .035, .121)
  s.bezierCurveTo(.007, .158, -.048, .173, -.080, .213)
  s.quadraticCurveTo(-.099, .239, -.077, .276)
}, .092, .010)

const knob = new LatheGeometry([
  [0, -.027], [.012, -.027], [.014, -.022], [.014, -.016], [.011, -.013],
  [.016, -.009], [.017, -.004], [.015, .000], [.011, .002],
  [.014, .006], [.014, .011], [.010, .015], [0, .017],
].map(([r, y]) => new Vector2(r, y)), 16)

function sweep(points, radiusAt, segments = 30, sides = 10) {
  const path = new CatmullRomCurve3(points.map(point => new Vector3(...point)))
  const geometry = new TubeGeometry(path, segments, 1, sides, false)
  const { position } = geometry.attributes
  const center = new Vector3()
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    path.getPointAt(t, center)
    const radius = radiusAt(t)
    for (let side = 0; side <= sides; side++) {
      const index = i * (sides + 1) + side
      position.setXYZ(index,
        center.x + (position.getX(index) - center.x) * radius,
        center.y + (position.getY(index) - center.y) * radius,
        center.z + (position.getZ(index) - center.z) * radius)
    }
  }
  geometry.computeVertexNormals()
  return geometry
}

// The upper post turns inward across the back. Its rounded end tapers into the scroll.
const shoulder = sweep([
  [.010, .350, -.235], [.011, .513, -.230], [.011, .679, -.240], [.004, .808, -.258],
  [-.028, .879, -.275], [-.079, .891, -.278], [-.115, .871, -.263], [-.129, .833, -.250], [-.124, .810, -.247],
], t => t < .81 ? .060 - .007 * t : .054 * Math.sqrt(1 - ((t - .81) / .192) ** 2), 37, 15)

const armRail = sweep([
  [0, .354, -.222], [0, .492, -.222], [0, .554, -.170], [0, .563, -.040],
  [0, .559, .147], [0, .547, .229], [0, .507, .273], [0, .435, .288], [0, .354, .287],
], () => .026, 25, 12)

const ring = new TorusGeometry(.027, .0036, 6, 16).rotateX(Math.PI / 2)
const leaf = new SphereGeometry(1, 6, 4)
const dome = new SphereGeometry(1, 12, 7)
const circle = new TorusGeometry(1, .046, 6, 28)

function reliefScroll(radius, depth, segments, sides) {
  const points = Array.from({ length: segments + 1 }, (_, i) => {
    const t = i / segments
    const angle = t * 2.32 * Math.PI
    const r = radius * (1 - t * .92)
    return [Math.cos(angle) * r, Math.sin(angle) * r, 0]
  })
  return sweep(points, t => depth * (.95 - .46 * t), segments, sides)
}

const scroll = reliefScroll(.034, .0055, 19, 6)
const smallScroll = reliefScroll(.021, .0042, 15, 5)

function builder() {
  const pieces = []
  function add(source, color, at = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const piece = source.index ? source.toNonIndexed() : source.clone()
    piece.scale(...scale).rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2]).translate(...at)
    if (scale[0] * scale[1] * scale[2] < 0) {
      // Reflection reverses winding. Swap the second and third vertices of each triangle.
      for (const attribute of Object.values(piece.attributes)) {
        const { array, itemSize } = attribute
        for (let i = 0; i < array.length; i += itemSize * 3) {
          for (let j = i + itemSize; j < i + itemSize * 2; j++) {
            const saved = array[j]
            array[j] = array[j + itemSize]
            array[j + itemSize] = saved
          }
        }
      }
    }
    const tint = new Color(color)
    const colors = new Float32Array(piece.attributes.position.count * 3)
    for (let i = 0; i < colors.length; i += 3) tint.toArray(colors, i)
    piece.setAttribute('color', new Float32BufferAttribute(colors, 3))
    pieces.push(piece)
  }

  function molding(at, size, color, radius = .009) {
    const box = new RoundedBoxGeometry(...size, 1, radius)
    add(box, color, at)
    box.dispose()
  }

  function combine() {
    const merged = mergeGeometries(pieces)
    for (const piece of pieces) piece.dispose()
    const geometry = mergeVertices(merged)
    merged.dispose()
    return geometry
  }
  return { add, molding, combine }
}

function rosette({ add }, x, y, z, sx = 1, sy = 1) {
  add(dome, inset, [x, y, z], [.055 * sx, .055 * sy, .005])
  add(circle, cut, [x, y, z + .001], [.063 * sx, .063 * sy, .035])
  add(circle, raised, [x, y, z + .003], [.055 * sx, .055 * sy, .039])
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6
    const px = x + Math.cos(a) * .036 * sx
    const py = y + Math.sin(a) * .036 * sy
    add(leaf, raised, [px, py, z + .005], [.020 * sx, .008 * sy, .004], [0, 0, a + .53])
    add(leaf, frame, [x + Math.cos(a + .4) * .021 * sx, y + Math.sin(a + .4) * .021 * sy, z + .008], [.011 * sx, .006 * sy, .004], [0, 0, a + .98])
  }
  add(dome, raised, [x, y, z + .010], [.012 * sx, .012 * sy, .005])
}

function floralRail({ add }, x, y, z, count, spacing, scale = 1) {
  for (let i = 0; i < count; i++) {
    const pos = x + (i - (count - 1) / 2) * spacing
    const flip = i % 2 ? 1 : -1
    add(smallScroll, raised, [pos, y, z], [scale * flip, scale * .79, scale], [0, 0, .28 * flip])
    for (const side of [-1, 1]) {
      add(leaf, frame, [pos + side * .012 * scale, y + side * flip * .012 * scale, z + .001],
        [.012 * scale, .0045 * scale, .003], [0, 0, side * .68])
    }
  }
}

function backrest(model, x, width = 1) {
  const { add, molding } = model
  const z = -.239
  add(crest, edge, [x, 0, z], [width, 1, 1])
  add(stile, wood, [x, 0, z], [width, 1, 1])
  add(panel, inset, [x, 0, z + .038], [width, 1, 1])
  add(panel, inset, [x, 0, z - .041], [width, 1, .65])
  molding([x, .503, z - .003], [.488 * width, .033, .051], frame, .005)
  add(lowerRail, edge, [x, 0, z + .013], [width, 1, 1])
  molding([x, .444, z + .057], [.434 * width, .061, .015], cut, .008)
  molding([x, .444, z + .065], [.421 * width, .052, .010], inset, .005)
  molding([x, .443, z - .035], [.432 * width, .059, .015], inset, .006)
  rosette(model, x, .796, z + .052, width, 1)
  rosette(model, x, 1.028, z + .050, width * .98, .46)
  floralRail(model, x, .444, z + .073, 8, .048 * width, .81)
  for (const side of [-1, 1]) {
    add(wing, frame, [x, 0, z], [side * width, 1, 1])
    add(knob, edge, [x + side * .196 * width, 1.061, z + .003], [1, 1, 1], [0, 0, -side * Math.PI / 2])
    for (let i = 0; i < 5; i++) {
      const cx = x + side * (.181 + (i % 2) * .023) * width
      const y = .553 + i * .055
      const rotation = side * (i % 2 ? -.38 : .39)
      add(scroll, raised, [cx, y, z + .034], [side * width, .83, 1], [0, 0, rotation])
      add(smallScroll, cut, [cx + side * .011 * width, y + .007, z + .033],
        [.61 * side * width, .61, .60], [0, 0, rotation + side * 1.54])
      add(leaf, raised, [cx + side * .029 * width, y + .013, z + .036], [.010, .006, .003], [0, 0, side * .58])
    }
    molding([x + side * .206 * width, .821, z + .018], [.147 * width, .044, .066], edge, .014)
  }
}

const wristRest = profile(s => {
  s.moveTo(-.077, -.052)
  s.lineTo(.077, -.052)
  s.quadraticCurveTo(.087, 0, .068, .066)
  s.quadraticCurveTo(0, .086, -.068, .066)
  s.quadraticCurveTo(-.087, 0, -.077, -.052)
}, .019, .008).rotateX(-Math.PI / 2)

function armrest(model, x, side) {
  const { add, molding } = model
  add(shoulder, wood, [x, 0, 0], [side, 1, 1])
  for (const offset of [-.039, .039]) {
    add(armRail, edge, [x + offset, 0, 0])
    for (const [height, z] of [[.369, .286], [.407, .290], [.545, .218]]) {
      add(ring, frame, [x + offset, height, z], [1, 1, 1], height === .545 ? [1.33, 0, 0] : undefined)
    }
  }
  molding([x, .464, .010], [.038, .062, .383], frame)
  molding([x, .423, .025], [.026, .029, .387], edge)
  add(wristRest, wood, [x, .579, .108])
  const horizontal = {
    add: (piece, color, [dx, dy, dz], scale, [rx = 0, ry = 0, rz = 0] = []) => {
      const rotated = piece.clone().rotateZ(rz)
      add(rotated, color, [x + dx, .596 + dz, .108 - dy], scale, [rx - Math.PI / 2, ry, 0])
      rotated.dispose()
    },
  }
  rosette(horizontal, 0, 0, 0, .59, .54)
}

function makeSeat(width, backs) {
  const model = builder()
  const { add, molding, combine } = model
  const depth = .652
  molding([0, .291, 0], [width, .104, depth], frame)
  molding([0, .249, 0], [width - .012, .024, depth - .009], edge, .006)
  molding([0, .353, 0], [width + .021, .045, depth + .016], edge, .011)
  molding([0, .373, -.008], [width - .070, .026, depth - .065], wood)
  for (let i = 0; i < backs * 3; i++) {
    const w = width / (backs * 3)
    const x = -width / 2 + (i + .5) * w
    for (const side of [-1, 1]) {
      molding([x, .293, side * (depth / 2 + .003)], [w - .024, .065, .012], cut, .005)
      molding([x, .295, side * (depth / 2 + .008)], [w - .038, .053, .010], inset, .005)
    }
  }
  for (const side of [-1, 1]) {
    const x = side * (width / 2 - .082)
    armrest(model, x, side)
    for (const z of [-.23, .23]) add(seatFoot, frame, [x, 0, z], [side, 1, 1], [0, z > 0 ? -side * .22 : side * .22, 0])
    molding([side * (width / 2 + .002), .294, 0], [.012, .061, .475], inset, .005)
  }
  for (let i = 0; i < backs; i++) backrest(model, (i - (backs - 1) / 2) * .53, backs > 1 ? .90 : 1)
  if (backs > 1) {
    for (const x of [-.264, .264]) {
      molding([x, .609, -.245], [.068, .419, .075], edge, .013)
      add(dome, edge, [x, .822, -.24], [.031, .060, .033])
      add(leaf, raised, [x, .848, -.214], [.020, .025, .011], [0, 0, .21])
    }
  }
  return combine()
}

export const carvedChair = makeSeat(.734, 1)
export const carvedBench = makeSeat(1.84, 3)
