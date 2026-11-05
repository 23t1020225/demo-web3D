import fs from 'node:fs/promises'
import { DataUtils } from 'three'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

const input = await fs.readFile(new URL('../src/assets/partly-cloudy.hdr', import.meta.url))
const image = new HDRLoader().parse(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength))
const width = 256, height = 128
const row = new Uint8Array(width * 4)
const chunks = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`)]
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const rgb = [0, 0, 0]
    let samples = 0
    for (let sy = Math.floor(y * image.height / height); sy < Math.floor((y + 1) * image.height / height); sy++) {
      for (let sx = Math.floor(x * image.width / width); sx < Math.floor((x + 1) * image.width / width); sx++) {
        for (let c = 0; c < 3; c++) rgb[c] += DataUtils.fromHalfFloat(image.data[(sy * image.width + sx) * 4 + c])
        samples++
      }
    }
    const maximum = Math.max(...rgb) / samples
    const exponent = maximum < 1e-32 ? 0 : Math.floor(Math.log2(maximum)) + 1
    const scale = maximum < 1e-32 ? 0 : 256 / Math.pow(2, exponent) / samples
    for (let c = 0; c < 3; c++) row[x * 4 + c] = Math.min(255, Math.floor(rgb[c] * scale))
    row[x * 4 + 3] = maximum < 1e-32 ? 0 : exponent + 128
  }
  chunks.push(Buffer.from([2, 2, width >> 8, width & 255]))
  for (let c = 0; c < 4; c++) {
    for (let x = 0; x < width;) {
      let run = 1
      while (x + run < width && run < 127 && row[(x + run) * 4 + c] === row[x * 4 + c]) run++
      if (run >= 4) { chunks.push(Buffer.from([128 + run, row[x * 4 + c]])); x += run; continue }
      const start = x++
      while (x < width && x - start < 128) {
        let same = 1
        while (x + same < width && same < 4 && row[(x + same) * 4 + c] === row[x * 4 + c]) same++
        if (same >= 4) break
        x++
      }
      chunks.push(Buffer.from([x - start, ...Array.from({ length: x - start }, (_, i) => row[(start + i) * 4 + c])]))
    }
  }
}
const result = Buffer.concat(chunks)
const verify = new HDRLoader().parse(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength))
if (verify.width !== width || verify.height !== height) throw new Error('Invalid optimized HDR')
await fs.writeFile(new URL('../src/assets/partly-cloudy-balanced.hdr', import.meta.url), result)
console.log(JSON.stringify({ beforeBytes: input.byteLength, afterBytes: result.byteLength, width, height }))
