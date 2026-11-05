import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { initialRoomIds } from './quality-profile.js'

const imports = {
  'living-left': () => import('./reference-left-living.jsx').then(m => ({ default: m.ReferenceLeftLiving })),
  'living-right': () => import('./reference-right-living.jsx').then(m => ({ default: m.ReferenceRightLiving })),
  'kitchen-right': () => import('./reference-kitchen.jsx').then(m => ({ default: m.ReferenceKitchen })),
  bathroom: () => import('./reference-rear-section.jsx').then(m => ({ default: m.ReferenceRearSection })),
  'bedroom-left': () => import('./room-furnishings.jsx').then(m => ({ default: m.Bedroom })),
}
const promises = new Map()
function preload(id) {
  if (!promises.has(id)) promises.set(id, imports[id]())
  return promises.get(id)
}
const components = Object.fromEntries(Object.keys(imports).map(id => [id, lazy(() => preload(id))]))

function Zone({ id, readyZones, children }) {
  const group = useRef(null)
  const prepared = useRef(false)
  useFrame(() => {
    // Stable scene membership also keeps shadow and reflection passes consistent.
    group.current.visible = prepared.current
  }, -.5)
  return <group ref={group} name={`room-zone-${id}`} visible={false}>
    <Suspense fallback={null}>{children}<ZoneReady id={id} zone={group} prepared={prepared} readyZones={readyZones} /></Suspense>
  </group>
}

function ZoneReady({ id, zone, prepared, readyZones }) {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    let stopped = false, timer
    function done() {
      if (stopped) return
      prepared.current = true
      readyZones.current.add(id)
      scene.userData.visualRevision = (scene.userData.visualRevision || 0) + 1
      gl.shadowMap.needsUpdate = true
      invalidate()
    }
    function prepare() {
      if (stopped) return
      if (camera.userData.cameraMoving) { timer = setTimeout(prepare, 250); return }
      // Compile with the house's actual lighting before revealing the room.
      gl.compileAsync(zone.current, camera, scene).then(done, error => {
        console.warn('Room material preparation could not finish', error)
        done()
      })
    }
    prepare()
    return () => {
      stopped = true; clearTimeout(timer)
      prepared.current = false
      readyZones.current.delete(id)
    }
  }, [id, zone, prepared, readyZones, gl, scene, camera, invalidate])
  return null
}

export function RoomZones({ surfaces, room, active, onInspect, readyZones }) {
  const critical = initialRoomIds(room?.id)
  const [retained, setRetained] = useState(() => critical)
  const current = new Set([...retained, ...critical])
  useEffect(() => {
    setRetained(previous => [...new Set([...previous, ...initialRoomIds(room?.id)])])
  }, [room?.id])
  useEffect(() => {
    let stopped = false, timer, idle
    let lastInput = performance.now()
    const touched = () => { lastInput = performance.now() }
    for (const name of ['pointerdown', 'pointermove', 'wheel', 'keydown']) window.addEventListener(name, touched, { passive: true })
    const pending = Object.keys(imports).filter(id => !initialRoomIds(room?.id).includes(id))
    function next() {
      if (stopped || !pending.length) return
      if (performance.now() - lastInput < 1200 || document.hidden) { timer = setTimeout(next, 1200); return }
      const id = pending.shift()
      preload(id).then(() => {
        if (stopped) return
        setRetained(previous => previous.includes(id) ? previous : [...previous, id])
        timer = setTimeout(schedule, 1500)
      }).catch(() => { if (!stopped) timer = setTimeout(schedule, 3000) })
    }
    function schedule() { idle = window.requestIdleCallback ? window.requestIdleCallback(next, { timeout: 5000 }) : setTimeout(next, 250) }
    timer = setTimeout(schedule, 1800)
    return () => {
      stopped = true; clearTimeout(timer)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else clearTimeout(idle)
      for (const name of ['pointerdown', 'pointermove', 'wheel', 'keydown']) window.removeEventListener(name, touched)
    }
  }, [])
  return [...current].map(id => {
    const Component = components[id]
    const content = <Component surfaces={surfaces} active={active === id}
      bedroomActive={room?.id === 'bedroom-left'} onInspect={active === id ? onInspect : undefined}
      onDividerInspect={active === 'living-left' ? onInspect : undefined} />
    return <Zone key={id} id={id} readyZones={readyZones}>{content}</Zone>
  })
}
