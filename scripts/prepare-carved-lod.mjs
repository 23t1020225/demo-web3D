import fs from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { DataUtils } from 'three'
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js'
import { carvedChair, carvedBench } from '../src/carved-seats.js'

const output = new URL('../src/assets/models/', import.meta.url)
await fs.mkdir(output, { recursive: true })
function pack(geometry) {
  const parts = [], descriptors = []
  let offset = 0
  for (const [name, attribute] of [...Object.entries(geometry.attributes), ['index', geometry.index]]) {
    let array = attribute.array, normalized = attribute.normalized, float16 = false
    if (name === 'position' || name === 'uv') {
      array = Uint16Array.from(attribute.array, value => DataUtils.toHalfFloat(value)); float16 = true
    } else if (name === 'normal') {
      array = Int16Array.from(attribute.array, value => Math.round(Math.max(-1, Math.min(1, value)) * 32767)); normalized = true
    } else if (name === 'color') {
      array = Uint8Array.from(attribute.array, value => Math.round(Math.max(0, Math.min(1, value)) * 255)); normalized = true
    }
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
    descriptors.push({ name, itemSize: attribute.itemSize, normalized, float16,
      type: array.constructor.name, length: array.length, offset })
    const padding = (4 - bytes.byteLength % 4) % 4
    parts.push(bytes, Buffer.alloc(padding)); offset += bytes.byteLength + padding
  }
  const json = Buffer.from(JSON.stringify(descriptors))
  const prefix = Buffer.alloc(4 + Math.ceil(json.length / 4) * 4)
  prefix.writeUInt32LE(json.length); json.copy(prefix, 4)
  return gzipSync(Buffer.concat([prefix, ...parts]), { level: 9 })
}
const report = []
const modifier = new SimplifyModifier()
for (const [name, original] of [['chair', carvedChair], ['bench', carvedBench]]) {
  for (const [level, ratio] of [['near', .80], ['far', .20]]) {
    const geometry = await modifier.modify(original, Math.round(original.attributes.position.count * (1 - ratio)))
    const packed = pack(geometry)
    await fs.writeFile(new URL(`${name}-${level}.geometry.bin`, output), packed)
    report.push({ name, level, triangles: geometry.index.count / 3, bytes: packed.length })
    geometry.dispose()
  }
}
console.log(JSON.stringify(report))
