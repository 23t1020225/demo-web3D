import { BufferAttribute, BufferGeometry, FileLoader, Float16BufferAttribute, Loader } from 'three'

export async function decodePackedGeometry(compressed) {
        const signature = new Uint8Array(compressed, 0, 2)
        const isGzip = signature[0] === 31 && signature[1] === 139
        const buffer = isGzip ? await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer() : compressed
        const headerBytes = new DataView(buffer).getUint32(0, true)
        if (headerBytes > buffer.byteLength - 4) throw new Error('Invalid geometry header')
        const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, headerBytes)))
        const dataOffset = 4 + Math.ceil(headerBytes / 4) * 4
        const types = { Float32Array, Uint32Array, Uint16Array, Uint8Array, Int16Array }
        const geometry = new BufferGeometry()
        for (const part of header) {
          const Type = types[part.type]
          if (!Type) throw new Error('Unsupported geometry attribute')
          const values = new Type(buffer, dataOffset + part.offset, part.length)
          const attribute = part.float16 ? new Float16BufferAttribute(values, part.itemSize) : new BufferAttribute(values, part.itemSize, part.normalized)
          if (part.name === 'index') geometry.setIndex(attribute)
          else geometry.setAttribute(part.name, attribute)
        }
        geometry.computeBoundingSphere()
        return geometry
}

export class PackedGeometryLoader extends Loader {
  load(url, onLoad, onProgress, onError) {
    new FileLoader(this.manager).setResponseType('arraybuffer').load(url, async compressed => {
      try {
        onLoad(await decodePackedGeometry(compressed))
      } catch (error) { onError?.(error) }
    }, onProgress, onError)
  }
}
