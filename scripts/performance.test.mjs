import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { DataUtils, Vector2, Vector3 } from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { balancedQuality, initialRoomIds, visibleRoomIds } from '../src/quality-profile.js'
import { decodePackedGeometry } from '../src/geometry-loader.js'
import { carvedChair, carvedBench } from '../src/carved-seats.js'
import { standardMaterial, roundedGeometry } from '../src/model-resources.js'
import { balancedLightPanels, lightingProfile } from '../src/lighting-profile.js'
import { refreshReflection } from '../src/reflection-policy.js'

test('reflection refreshes on entry, after scene changes and immediately on stopping', () => {
  assert(refreshReflection(true, true, Infinity))
  assert(!refreshReflection(true, true, 30))
  assert(refreshReflection(true, true, 100))
  assert(refreshReflection(true, false, 1))
  assert(!refreshReflection(false, false, 1000))
  for (const id of ['living-left', 'living-right']) {
    const initial = initialRoomIds(id)
    assert(initial.includes('living-left') && initial.includes('living-right') && initial.includes('kitchen-right'))
  }
})

test('balanced quality lowers movement cost on both device classes', () => {
  const phone = balancedQuality({ memory: 8, cores: 8, touch: true, pixelRatio: 3 })
  assert.equal(phone.idleDpr, 2)
  assert.equal(phone.motionDpr, 1)
  assert.equal(phone.reflectionSize, 256)
  for (const memory of [2, 4, 8, 16]) {
    const q = balancedQuality({ memory, cores: 8 })
    assert(q.motionDpr < q.idleDpr)
    assert(q.motionDpr >= q.minDpr)
    assert(q.shadowSize <= 1536 && q.reflectionSize <= 384)
  }
})

test('retina clarity respects native density and keeps a lower budget on weak phones', () => {
  for (const pixelRatio of [1, 1.25, 2, 3, 4]) {
    const q = balancedQuality({ memory: 8, cores: 6, touch: true, pixelRatio })
    assert(q.idleDpr <= pixelRatio && q.idleDpr <= 2)
    assert(q.motionDpr <= q.idleDpr)
    assert(q.antialias)
  }
  const weak = balancedQuality({ memory: 4, cores: 4, touch: true, pixelRatio: 3 })
  assert.equal(weak.idleDpr, 1.5)
  assert(weak.motionDpr < weak.idleDpr)
})

test('visibility keeps reference views and open neighbouring rooms', () => {
  assert.deepEqual(new Set(visibleRoomIds(.27, -3.7, -.99, -.04)), new Set(['kitchen-right', 'bathroom', 'bedroom-left']))
  assert(visibleRoomIds(-2.19, -7.17, -.03, 1).includes('bathroom'))
  assert(visibleRoomIds(-2.19, -7.17, -.03, 1).includes('kitchen-right'))
  assert(visibleRoomIds(-2.52, -1.06, .35, .9).includes('living-right'))
  assert(visibleRoomIds(2.58, -3.38, -.3, -.95).includes('bedroom-left'))
  assert(!visibleRoomIds(.38, -7, 0, -1).includes('living-left'))
  assert(initialRoomIds('bathroom').includes('bathroom'))
})

test('compressed furniture works with and without HTTP decompression', async () => {
  for (const [name, original] of [['chair', carvedChair], ['bench', carvedBench]]) {
    original.computeBoundingBox()
    const originalSize = original.boundingBox.getSize(new Vector3())
    for (const level of ['near', 'far']) {
      const file = await fs.readFile(new URL(`../src/assets/models/${name}-${level}.geometry.bin`, import.meta.url))
      for (const source of [file, gunzipSync(file)]) {
        const geometry = await decodePackedGeometry(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength))
        geometry.computeBoundingBox()
        assert(geometry.getAttribute('color').normalized)
        assert(geometry.index.count < original.index.count)
        assert(Number.isFinite(geometry.boundingSphere.radius))
        const size = geometry.boundingBox.getSize(new Vector3())
        assert(size.distanceTo(originalSize) < (level === 'near' ? .006 : .025))
        geometry.dispose()
      }
    }
  }
})

test('resource sharing keeps distinct finishes distinct', () => {
  assert.equal(roundedGeometry([1, 2, .03], .005), roundedGeometry([1, 2, .03], .005))
  const first = standardMaterial('#fff', .5, { normalScale: new Vector2(.2, .2) })
  assert.equal(first, standardMaterial('#fff', .5, { normalScale: new Vector2(.2, .2) }))
  assert.notEqual(first, standardMaterial('#fff', .7, { normalScale: new Vector2(.2, .2) }))
})

test('small HDR preserves average illumination', async () => {
  const mean = async name => {
    const bytes = await fs.readFile(new URL(`../src/assets/${name}`, import.meta.url))
    const hdr = new HDRLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    let sum = 0
    for (let i = 0; i < hdr.data.length; i += 4) sum += DataUtils.fromHalfFloat(hdr.data[i]) + DataUtils.fromHalfFloat(hdr.data[i + 1]) + DataUtils.fromHalfFloat(hdr.data[i + 2])
    return sum / (hdr.width * hdr.height)
  }
  const [before, after] = await Promise.all([mean('partly-cloudy.hdr'), mean('partly-cloudy-balanced.hdr')])
  assert(Math.abs(before - after) / before < .02)
})

test('balanced lighting stays fixed and uses fewer area lights', () => {
  assert.equal(balancedLightPanels.length, 3)
  assert.equal(lightingProfile.exposure, .9)
  assert(balancedLightPanels.every(light => light.color === lightingProfile.ceiling || light.color === lightingProfile.daylight))
})
