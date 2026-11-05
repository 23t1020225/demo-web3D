import React, { lazy, memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, BackSide, CatmullRomCurve3, Color, EquirectangularReflectionMapping, MathUtils, Matrix4, PCFShadowMap, Quaternion, Vector3 } from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { ReferenceHouse } from './reference-house.jsx'
import { markerPositions, ReferenceInterior } from './reference-interior.jsx'
import { entryDoor, entryHall, entryRoom, rooms } from './house-layout.js'
import { useSurfaces } from './surfaces.js'
import skyUrl from './assets/partly-cloudy-balanced.hdr?url'
import { rearItemPoint, rearViewPoint } from './rear-plan.js'
import { lightingProfile } from './lighting-profile.js'
import { PerformanceProbe } from './performance-probe.jsx'
import { deviceQuality, initialRoomIds } from './quality-profile.js'

const { clamp, damp, lerp, smoothstep } = MathUtils
const shadows = { enabled: true, autoUpdate: false, type: PCFShadowMap }
const Yard = lazy(() => import('./reference-yard.jsx').then(m => ({ default: m.ReferenceYard })))
const House = memo(ReferenceHouse)
const Interior = memo(ReferenceInterior)
const roomPoses = new Map(rooms.map(room => {
  const eye = new Vector3(...room.eye)
  const direction = new Vector3(...room.aim).sub(eye)
  return [room.id, { ...room, eye, look: { x: eye.x, y: eye.y, z: eye.z, yaw: Math.atan2(direction.x, -direction.z), pitch: Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), zoom: 1, phoneBias: 1 } }]
}))
const roomDetails = {
  armchairs: { eye: [2.21, 1.58, -.20], target: [.80, 1.01, -.25], zoom: .99, partZoom: .64 },
  'carved-bench': { eye: [1.02, 1.62, .19], target: [2.49, 1.04, -.25], zoom: .93 },
  chandelier: { eye: [1.36, 1.58, .49], target: [1.42, 2.70, -.197], zoom: .86 },
  sofa: { eye: [-1.63, 1.68, .89], target: [-2.84, .86, -.85], zoom: .91 },
  table: { eye: [-1.92, 1.60, .43], target: [-2.49, .79, -.77], zoom: .79 },
  'left-stools': { eye: [-2.10, 1.05, .07], target: [-2.48, .56, -.48], zoom: .83 },
  'left-flowers': { eye: [-1.97, 1.53, -.12], target: [-2.40, 1.01, -.78], zoom: .60 },
  'left-sewing': { eye: [-1.65, 1.61, .24], target: [-2.77, 1.25, 1.24], zoom: .86, partZoom: .58 },
  'left-folding-chair': { eye: [-1.72, 1.48, .13], target: [-2.56, .82, .62], zoom: .76 },
  'left-study': { eye: [-1.96, 1.50, -.36], target: [-.48, 1.16, -1.09], zoom: .95 },
  art: { eye: [-2.10, 1.98, -.65], target: [-3.80, 2.10, -.65], zoom: .68 },
  'left-wall-light': { eye: [-2.05, 1.72, -.23], target: [-3.80, 2.58, -.65], zoom: .65 },
  'left-window': { eye: [-2.13, 1.72, -.25], target: [-2.54, 1.66, 1.57], zoom: .83 },
  'left-divider': { eye: [-1.49, 1.73, .88], target: [-.13, 1.53, -.63], zoom: .96 },
  'left-ceiling': { eye: [-1.24, 1.43, .75], target: [-2.02, 2.91, -.18], zoom: 1.05 },
  stove: { eye: [1.08, 1.58, -4.42], target: [1.64, 1.04, -5.96], zoom: .88, partZoom: .68 },
  sink: { eye: [1.34, 1.48, -4.76], target: [2.62, .98, -4.81], zoom: .84, partZoom: .66 },
  'kitchen-window': { eye: [1.38, 1.66, -4.82], target: [2.95, 1.86, -4.82], zoom: .84 },
  'lotus-art': { eye: [1.56, 1.98, -3.91], target: [2.92, 2.24, -3.91], zoom: .68 },
  'water-dispenser': { eye: [1.46, 1.34, -3.96], target: [2.68, .86, -3.88], zoom: .78 },
  'side-door': { eye: [1.28, 1.56, -3.28], target: [2.95, 1.42, -3.01], zoom: .90 },
  'dining-set': { eye: [.68, 1.58, -2.42], target: [1.88, 1.02, -3.08], zoom: .88, partZoom: .68 },
  'kitchen-tv-back': { eye: [1.56, 1.52, -3.68], target: [2.14, 1.32, -2.02], zoom: .84 },
  fridge: { eye: [1.18, 1.46, -4.42], target: [.78, 1.04, -5.85], zoom: .82 },
  'bedroom-doors': { eye: [2.28, 1.52, -3.85], target: [-.36, 1.44, -4.02], zoom: .96, partZoom: .82 },
  'deer-art': { eye: [1.58, 1.86, -4.02], target: [-.33, 2.12, -4.02], zoom: .74 },
  'kitchen-ceiling': { eye: [1.42, .92, -4.42], target: [1.48, 2.98, -4.22], zoom: 1.12 },
  'kitchen-mat': { eye: [1.56, 1.24, -4.55], target: [1.92, .38, -5.48], zoom: .72 },
  'dish-cabinet': { eye: [-.40, 1.42, -6.82], target: [-1.46, .92, -6.14], zoom: .88, partZoom: .74 },
  'wc-doors': { eye: [-.42, 1.45, -6.75], target: [-2.34, 1.28, -6.80], zoom: .94, partZoom: .78 },
  'rear-wood-door': { eye: [-1.76, 1.50, -6.92], target: [.49, 1.51, -6.65], zoom: .95, partZoom: .80 },
  'rear-window': { eye: [-.22, 1.48, -6.14], target: [-.22, 1.48, -7.52], zoom: .74 },
  'rear-tube-light': { eye: [-.98, .98, -6.79], target: [-.98, 2.96, -7.12], zoom: 1.14 },
  basin: { eye: [-1.85, 1.44, -7.08], target: [-3.48, 1.08, -6.22], zoom: .82 },
  toilet: { eye: [-1.85, 1.36, -7.14], target: [-3.42, .78, -7.42], zoom: .82 },
  shower: { eye: [-1.85, 1.48, -7.08], target: [-3.62, 1.58, -6.78], zoom: .78 },
}
for (const id of ['wc-doors', 'rear-wood-door', 'rear-window', 'rear-tube-light', 'basin', 'toilet', 'shower']) {
  roomDetails[id].eye = rearViewPoint(roomDetails[id].eye)
  roomDetails[id].target = rearItemPoint(id, roomDetails[id].target)
}
const gateRoute = [[3.92, 2.09, 8.21], [3.94, 1.97, 6.64], [3.92, 1.93, 5.51]]
const porchRoute = [[2.25, 1.93, 4.69], [1.10, 1.88, 3.47], [1.10, 1.79, 1.72]]
const worldUp = new Vector3(0, 1, 0)

export const viewpoints = [
  { id: 'gate', label: 'Cổng', eye: [3.84, 2.06, 12.28], target: [2.72, 2.52, 3.31], fov: 51,
    description: 'Mái ngói bốn dốc, trụ bê tông và hai cánh cổng sắt nằm trước lối xe.' },
  { id: 'right', label: 'Góc phải', eye: [13.56, 2.23, 13.07], target: [1.42, 2.35, .77], fov: 40,
    description: 'Nhìn dọc mái tôn và hàng rào bên phải, thấy đầu hồi xanh nhạt phía trên.' },
  { id: 'left', label: 'Góc trái', eye: [-13.94, 2.28, 13.86], target: [-.17, 2.40, .81], fov: 41,
    description: 'Nhìn từ đường bên trái để thấy các mái ngói giao nhau và cửa chớp bên hông.' },
  { id: 'front', label: 'Mặt tiền', eye: [-5.13, 2.29, 12.79], target: [-.63, 2.68, 1.87], fov: 44,
    description: 'Góc thấy rõ ô tròn trên đầu hồi, vòm hiên hai cột và cửa gỗ đỏ phía trước.' },
]

export const closeups = [
  { id: 'roof-detail', label: 'Mái ngói', reference: 'front', eye: [-3.34, 5.38, 7.79], target: [-.46, 4.46, 2.14], fov: 32, phoneFov: 54,
    minimum: 3.4, description: 'Xem mép ngói chồng lên nhau và viền nổi quanh ô tròn trên đầu hồi.' },
  { id: 'wood-detail', label: 'Cửa gỗ', reference: 'front', eye: [-3.34, 1.94, 5.57], target: [-2.54, 1.60, 1.89], fov: 36, phoneFov: 61,
    minimum: 1.75, description: 'Xem vân gỗ đỏ, gờ nổi và bản lề trên các cánh cửa chớp.' },
  { id: 'gate-detail', label: 'Cổng sắt', reference: 'gate', eye: [3.20, 1.75, 10.56], target: [2.98, 1.37, 6.54], fov: 37, phoneFov: 60,
    minimum: 1.85, description: 'Xem các mối nối thanh sắt, chốt cổng và bề mặt bê tông cạnh cánh cổng.' },
]

const allViews = [...viewpoints, ...closeups]

function pose(id) {
  const { eye, target, fov, phoneFov } = allViews.find(view => view.id === id)
  const x = eye[0] - target[0]
  const z = eye[2] - target[2]
  const radius = Math.hypot(x, z)
  return {
    x: target[0], y: target[1], z: target[2], theta: Math.atan2(x, z), lift: Math.atan2(eye[1] - target[1], radius),
    radius, fov, phoneFov: phoneFov ?? fov + 4, phonePullback: phoneFov ? 0 : 1,
  }
}

function eyeFor(state, aspect, target = new Vector3()) {
  const framing = 1 + (Math.max(1, .765 / aspect) - 1) * state.phonePullback
  const radius = state.radius * framing
  return target.set(state.x + Math.sin(state.theta) * radius, Math.max(.92, state.y + Math.tan(state.lift) * state.radius), state.z + Math.cos(state.theta) * radius)
}

function nearestAngle(from, to) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

function aimInRoom(room, state, portrait, target) {
  const yaw = state.yaw + (portrait ? room.phonePan * state.phoneBias : 0)
  const horizontal = Math.cos(state.pitch)
  return target.set(state.x + Math.sin(yaw) * horizontal, state.y + Math.sin(state.pitch), state.z - Math.cos(yaw) * horizontal)
}

function entryPoints(start) {
  const inYard = start.x > -4.89 && start.x < 7.05 && start.z > 3.67 && start.z < 6.36
  if (inYard) return porchRoute.slice(1)
  return start.z < 8 && Math.abs(start.x - 1.1) > 4
    ? [[start.x, Math.max(2.2, start.y), 9.4], ...gateRoute, ...porchRoute]
    : [...gateRoute, ...porchRoute]
}

function CameraRig({ angle, controls, door, yard, exterior, roof, readyZones, onReady, onUnavailable, onSettled, reviewOpen }) {
  const { camera, gl, size, invalidate, setDpr } = useThree()
  const quality = useMemo(deviceQuality, [])
  const room = roomPoses.get(angle)
  const neededRooms = useMemo(() => initialRoomIds(room?.id), [room])
  const inRoom = Boolean(room)
  const current = useRef(pose(inRoom ? 'front' : angle))
  const goal = useRef(pose(inRoom ? 'front' : angle))
  const roomLook = useRef({ ...room?.look })
  const roomGoal = useRef({ ...room?.look })
  const currentRoom = useRef(room)
  const flight = useRef(null)
  const lookAt = useRef(new Vector3())
  const shadowOpening = useRef(0)
  const motion = useRef({ frames: 0, slow: 0, scaled: false, restore: null })
  const ready = useRef(false)
  const callbacks = useRef(null)
  callbacks.current = { onReady, onUnavailable, onSettled }

  useLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!inRoom) goal.current = pose(angle)
    const fromRoom = currentRoom.current
    if (fromRoom !== room) {
      const aspect = size.width / Math.max(1, size.height)
      const start = camera.position.clone()
      const end = room ? room.eye : eyeFor(goal.current, aspect)
      const aim = room ? aimInRoom(room, room.look, aspect < .9, new Vector3()) : new Vector3(goal.current.x, goal.current.y, goal.current.z)
      const indoors = Boolean(fromRoom && room)
      let points
      if (indoors) {
        const crossesWalkway = (fromRoom.section === 1 && room.section > 1) || (room.section === 1 && fromRoom.section > 1)
        points = crossesWalkway ? [fromRoom.hall, [.25, 1.72, -2.05], room.hall] : [fromRoom.hall, room.hall]
      }
      else if (room) points = [...entryPoints(start), entryDoor, ...(room.id === entryRoom ? [] : [entryHall, room.hall])]
      else points = [...(fromRoom.id === entryRoom ? [] : [fromRoom.hall, entryHall]), entryDoor, ...[...gateRoute, ...porchRoute].reverse()]
      currentRoom.current = room
      roomLook.current = { ...room?.look }
      roomGoal.current = { ...room?.look }
      if (reduced) callbacks.current.onSettled()
      else flight.current = {
        started: performance.now(), startFov: camera.fov, startRotation: camera.quaternion.clone(),
        endRotation: new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(end, aim, worldUp)),
        path: new CatmullRomCurve3([start, ...points.map(point => new Vector3(...point)), end]),
        indoors, duration: indoors ? 1530 : 3050,
      }
      current.current = { ...goal.current }
    } else if (reduced) current.current = { ...goal.current }
    invalidate()
  }, [angle, room, camera, invalidate])

  useLayoutEffect(() => { invalidate() }, [reviewOpen, invalidate])
  useEffect(() => () => clearTimeout(motion.current.restore), [])

  useEffect(() => {
    const canvas = gl.domElement
    const fingers = new Map()
    const view = allViews.find(item => item.id === angle)
    const close = Boolean(view?.reference)
    const center = inRoom ? 0 : pose(angle).theta

    function look(x, y) {
      if (flight.current) return
      if (inRoom) {
        roomGoal.current.yaw = room.fromPhotos ? roomGoal.current.yaw + x : clamp(roomGoal.current.yaw + x, -2.16, 1.73)
        roomGoal.current.pitch = clamp(roomGoal.current.pitch - y, -.61, room.fromPhotos ? 1.43 : .47)
      } else {
        goal.current.theta = clamp(goal.current.theta + x, close ? center - .55 : -1.37, close ? center + .55 : 1.37)
        goal.current.lift = clamp(goal.current.lift + y, -.16, .48)
      }
      invalidate()
    }

    function zoom(factor) {
      if (flight.current) return
      if (inRoom) roomGoal.current.zoom = clamp(roomGoal.current.zoom * factor, .36, 1.16)
      else goal.current.radius = clamp(goal.current.radius * factor, view.minimum ?? 7.7, close ? 11 : 27.5)
      invalidate()
    }

    function reset() {
      if (flight.current) return
      if (room) roomGoal.current = { ...room.look, yaw: nearestAngle(roomLook.current.yaw, room.look.yaw) }
      else goal.current = pose(angle)
      invalidate()
    }

    function focus(id, part) {
      const position = markerPositions.find(([key]) => key === id)?.[1]
      if (!inRoom || flight.current || !position) return
      const at = part?.at
      const detail = room.fromPhotos ? roomDetails[id] : undefined
      const target = at ?? detail?.target ?? [position.x, position.y - (room.fromPhotos ? .05 : .19), position.z]
      const chairEye = at && id === 'armchairs' ? [1.89, 1.55, at[2] + .36] : undefined
      const [x, y, z] = part?.eye ?? chairEye ?? detail?.eye ?? room.eye.toArray()
      const dx = target[0] - x
      const dz = z - target[2]
      const zoom = detail ? (at ? detail.partZoom ?? detail.zoom : detail.zoom) : .66
      roomGoal.current = {
        x, y, z, yaw: nearestAngle(roomLook.current.yaw, Math.atan2(dx, dz)),
        pitch: Math.atan2(target[1] - y, Math.hypot(dx, dz)), zoom, phoneBias: 0,
      }
      invalidate()
    }

    function photoView(view) {
      if (!room?.photoViews?.includes(view) || flight.current) return
      const [x, y, z] = view.eye
      const dx = view.aim[0] - x
      const dz = z - view.aim[2]
      roomGoal.current = {
        x, y, z, yaw: nearestAngle(roomLook.current.yaw, Math.atan2(dx, dz)),
        pitch: Math.atan2(view.aim[1] - y, Math.hypot(dx, dz)),
        zoom: view.zoom, phoneBias: 0,
      }
      invalidate()
    }

    function down(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      fingers.set(event.pointerId, [event.clientX, event.clientY])
      canvas.setPointerCapture(event.pointerId)
    }

    function move(event) {
      const previous = fingers.get(event.pointerId)
      if (!previous) return
      const { clientX: x, clientY: y } = event
      if (fingers.size === 1) {
        look((previous[0] - x) * .007, (y - previous[1]) * .006)
      } else if (fingers.size === 2) {
        const other = [...fingers.entries()].find(([id]) => id !== event.pointerId)[1]
        const oldDistance = Math.hypot(previous[0] - other[0], previous[1] - other[1])
        const distance = Math.hypot(x - other[0], y - other[1])
        if (oldDistance > 5 && distance > 5) zoom(oldDistance / distance)
      }
      fingers.set(event.pointerId, [x, y])
    }

    function end(event) { fingers.delete(event.pointerId) }
    function wheel(event) {
      event.preventDefault()
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1
      zoom(Math.exp(clamp(event.deltaY * scale, -120, 120) * .0017))
    }
    function contextLost() { callbacks.current.onUnavailable() }

    const listeners = [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end], ['lostpointercapture', end], ['wheel', wheel], ['webglcontextlost', contextLost]]
    for (const [name, handler] of listeners) canvas.addEventListener(name, handler, { passive: name !== 'wheel' })
    controls.current = { look, zoom, reset, focus, photoView }
    return () => {
      controls.current = null
      for (const [name, handler] of listeners) canvas.removeEventListener(name, handler)
    }
  }, [angle, room, inRoom, controls, gl, invalidate])

  useFrame((_, elapsed) => {
    const state = inRoom ? roomLook.current : current.current
    const destination = inRoom ? roomGoal.current : goal.current
    const pacing = motion.current
    const step = Math.min(elapsed, pacing.frames ? .075 : .022)
    let moving = false
    for (const key of Object.keys(destination)) {
      if (Math.abs(state[key] - destination[key]) < .001) state[key] = destination[key]
      else {
        state[key] = damp(state[key], destination[key], 13, step)
        moving = true
      }
    }
    if (moving) invalidate()

    const aspect = size.width / Math.max(1, size.height)
    const portrait = aspect < .9
    const targetFov = room ? (portrait ? room.phoneFov : room.fov) * state.zoom : portrait ? state.phoneFov : state.fov
    let roomBlend = Number(inRoom)
    let open = roomBlend
    const trip = flight.current
    const sceneReady = neededRooms.every(id => readyZones.current.has(id))
    camera.userData.sceneReady = sceneReady
    camera.userData.fastMotion = Boolean(trip) || moving
    camera.userData.cameraMoving = Boolean(trip) || moving
    if (trip || moving) {
      clearTimeout(pacing.restore)
      pacing.frames++
      if (!pacing.scaled) {
        pacing.scaled = true
        setDpr(quality.motionDpr)
      }
    } else if (pacing.frames) {
      pacing.restore = setTimeout(() => { setDpr(quality.idleDpr); invalidate() }, quality.restoreDelay)
      pacing.frames = pacing.slow = 0
      pacing.scaled = false
    }
    if (trip) {
      if (!sceneReady) {
        trip.started = performance.now()
        camera.userData.fastMotion = camera.userData.cameraMoving = false
        return
      }
      const progress = clamp((performance.now() - trip.started) / trip.duration, 0, 1)
      const distance = smoothstep(progress, 0, 1)
      trip.path.getPointAt(distance, camera.position)
      trip.path.getPointAt(Math.min(.9999, distance + .09), lookAt.current)
      if (distance < .998) camera.lookAt(lookAt.current)
      camera.quaternion.slerp(trip.startRotation, 1 - smoothstep(progress, 0, .21))
      camera.quaternion.slerp(trip.endRotation, smoothstep(progress, .72, 1))
      camera.fov = lerp(trip.startFov, targetFov, distance)
      if (!trip.indoors) {
        roomBlend = inRoom ? smoothstep(progress, .65, 1) : 1 - smoothstep(progress, 0, .35)
        open = 1 - smoothstep(camera.position.z, 2.58, 5.13)
      }
      if (progress === 1) {
        flight.current = null
        callbacks.current.onSettled()
      }
      invalidate()
    } else if (room) {
      camera.position.set(state.x, state.y, state.z)
      camera.lookAt(aimInRoom(room, state, portrait, lookAt.current))
      camera.fov = targetFov
    } else {
      eyeFor(state, aspect, camera.position)
      camera.lookAt(state.x, state.y, state.z)
      camera.fov = targetFov
    }
    const kitchenDoorPose = room?.id === 'kitchen-right' && !trip
    door.current.forEach((leaf, index) => {
      // The porch is on +Z: both leaves swing out, away from the interior.
      if (leaf) leaf.rotation.y = kitchenDoorPose ? (index === 0 ? 0 : 1.42) : (index === 0 ? -1 : 1) * 1.58 * open
    })
    const doorPose = door.current.map(leaf => leaf?.rotation.y ?? 0).join(',')
    if (doorPose !== shadowOpening.current) {
      shadowOpening.current = doorPose
      gl.shadowMap.needsUpdate = true
      _.scene.userData.visualRevision = (_.scene.userData.visualRevision || 0) + 1
    }
    // Keep physical shadow casters present; the renderer still frustum-culls meshes.
    if (size.width && size.height) {
      const compactStory = Boolean(room?.photoViews)
      const roomShift = compactStory ? .035 : .065
      const shiftX = portrait ? (compactStory ? size.width * .11 : 0) : -size.width * lerp(.128, roomShift, roomBlend)
      const phoneShift = compactStory ? (reviewOpen ? -.025 : .015) : (reviewOpen ? .035 : .118)
      const shiftY = -size.height * (portrait ? lerp(.145, phoneShift, roomBlend) : .031)
      camera.setViewOffset(size.width, size.height, shiftX, shiftY, size.width, size.height)
    }
    if (!ready.current && sceneReady) {
      ready.current = true
      callbacks.current.onReady()
    }
  }, -1)

  return null
}

function DaylightSky() {
  const texture = useLoader(HDRLoader, skyUrl)
  const { scene } = useThree()
  const colors = useMemo(() => ({ horizon: { value: new Color('#d6e5eb') }, blue: { value: new Color('#83a9da') } }), [])
  useLayoutEffect(() => {
    texture.mapping = EquirectangularReflectionMapping
    scene.environment = texture
    scene.environmentIntensity = lightingProfile.environment
    return () => { scene.environment = null }
  }, [scene, texture])

  return <mesh renderOrder={1000}>
    <sphereGeometry args={[113, 28, 14]} />
    <shaderMaterial side={BackSide} depthWrite={false} toneMapped={false} uniforms={colors}
      vertexShader="varying vec3 vWorld; void main() { vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
      fragmentShader={`varying vec3 vWorld;
        uniform vec3 horizon;
        uniform vec3 blue;
        void main() {
          float height = normalize(vWorld - cameraPosition).y;
          float blend = 1.0 - exp(-max(height + 0.023, 0.0) * 6.0);
          gl_FragColor = vec4(mix(horizon, blue, blend), 1.0);
          #include <colorspace_fragment>
        }`} />
  </mesh>
}

function MarkerProjection({ markers, panelOpen, reviewOpen }) {
  const projected = useMemo(() => new Vector3(), [])
  const fromCamera = useMemo(() => new Vector3(), [])
  const blocked = useRef([])
  const { invalidate, gl, size } = useThree()
  useLayoutEffect(() => {
    const canvas = gl.domElement.getBoundingClientRect()
    blocked.current = [...document.querySelectorAll('.topbar, .story, .bottom-bar, .review-card')].map(element => {
      const box = element.getBoundingClientRect()
      return { left: box.left - canvas.left, right: box.right - canvas.left, top: box.top - canvas.top, bottom: box.bottom - canvas.top }
    })
    invalidate()
  }, [gl, invalidate, size.width, size.height, panelOpen, reviewOpen])
  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld()
    for (const [id, position] of markerPositions) {
      const button = markers.current[id]
      if (!button) continue
      fromCamera.copy(position).applyMatrix4(camera.matrixWorldInverse)
      projected.copy(position).project(camera)
      const y = (1 - projected.y) * size.height / 2
      const x = (projected.x + 1) * size.width / 2
      const behindControls = blocked.current.some(box => x > box.left - 20 && x < box.right + 20 && y > box.top - 20 && y < box.bottom + 20)
      button.hidden = fromCamera.z > -.10 || Math.abs(projected.x) > .94 || Math.abs(projected.y) > .91 || behindControls
      if (!button.hidden) button.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`
    }
  })
  return null
}

function Model({ shadowSize, markers, showMarkers, moving, onInspect, ...props }) {
  const surfaces = useSurfaces()
  const { gl, invalidate } = useThree()
  const door = useRef([])
  const yard = useRef(null)
  const exterior = useRef(null)
  const roof = useRef(null)
  const readyZones = useRef(new Set())
  const room = roomPoses.get(props.angle)
  const active = !moving ? room?.id : undefined
  const [yardPrepared, setYardPrepared] = React.useState(!room || room.section === 1)
  useEffect(() => {
    if (!room || room.section === 1) { setYardPrepared(true); return }
    const token = setTimeout(() => setYardPrepared(true), 2500)
    return () => clearTimeout(token)
  }, [room?.section])
  useLayoutEffect(() => {
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, invalidate])
  return <>
    <DaylightSky />
    <fog attach="fog" args={['#d4dddc', 29, 79]} />
    <hemisphereLight color={lightingProfile.sky} groundColor={lightingProfile.ground} intensity={lightingProfile.ambient} />
    <directionalLight position={[-8, 13, 11]} color={lightingProfile.sun} intensity={lightingProfile.sunlight} castShadow shadow-radius={3.5} shadow-mapSize={[shadowSize, shadowSize]} shadow-bias={-.00009} shadow-normalBias={shadowSize > 1536 ? .008 : .013} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-camera-near={.3} shadow-camera-far={39} />
    <group ref={yard}>{yardPrepared && <Suspense fallback={null}><Yard surfaces={surfaces} /></Suspense>}</group>
    <House surfaces={surfaces} door={door} exterior={exterior} roof={roof} inside={Boolean(room)} />
    <Interior surfaces={surfaces} room={room} active={active} inside={Boolean(room) || moving} onInspect={onInspect} readyZones={readyZones} />
    <CameraRig {...props} door={door} yard={yard} exterior={exterior} roof={roof} readyZones={readyZones} />
    {new URLSearchParams(window.location.search).has('perf') && <PerformanceProbe />}
    {active && showMarkers && <MarkerProjection markers={markers} panelOpen={props.panelOpen} reviewOpen={props.reviewOpen} />}
  </>
}

export function ExteriorScene(props) {
  const quality = useMemo(deviceQuality, [])
  return <Canvas frameloop="demand" dpr={quality.idleDpr} shadows={shadows}
    camera={{ near: .06, far: 160, fov: 44 }} gl={{ antialias: quality.antialias, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: lightingProfile.exposure }}>
    <Suspense fallback={null}><Model {...props} shadowSize={quality.shadowSize} /></Suspense>
  </Canvas>
}
