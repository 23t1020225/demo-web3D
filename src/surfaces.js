import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2 } from 'three'
import plasterColor from './assets/painted_plaster_wall_diff_1k.webp'
import plasterNormal from './assets/painted_plaster_wall_nor_gl_1k.webp'
import woodColor from './assets/wood_table_worn_diff_1k.webp'
import woodNormal from './assets/wood_table_worn_nor_gl_1k.webp'
import asphaltColor from './assets/asphalt_track_diff_1k.jpg'
import asphaltNormal from './assets/asphalt_track_nor_gl_1k.webp'

const textures = [plasterColor, plasterNormal, woodColor, woodNormal, asphaltColor, asphaltNormal]

function roughnessFrom(image, low, high) {
  const map = paintedTexture(512, 512, ctx => {
    ctx.drawImage(image, 0, 0, 512, 512)
    const pixels = ctx.getImageData(0, 0, 512, 512)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const shade = (.2126 * pixels.data[i] + .7152 * pixels.data[i + 1] + .0722 * pixels.data[i + 2]) / 255
      const roughness = low + (high - low) * (1 - shade)
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255 * roughness
    }
    ctx.putImageData(pixels, 0, 0)
  })
  map.colorSpace = NoColorSpace
  return map
}

export function useSurfaces() {
  const [wall, wallNormal, wood, timberNormal, road, roadNormal] = useLoader(TextureLoader, textures)

  const surfaces = useMemo(() => {
    for (const map of [wall, wallNormal, wood, timberNormal, road, roadNormal]) {
      map.wrapS = map.wrapT = RepeatWrapping
      map.anisotropy = 4
    }
    for (const map of [wall, wood, road]) map.colorSpace = SRGBColorSpace
    for (const map of [road, roadNormal]) map.repeat.set(25, 3)

    const plaster = paintedTexture(1024, 1024, ctx => {
      ctx.fillStyle = '#fffdf8'
      ctx.fillRect(0, 0, 1024, 1024)
      ctx.globalAlpha = .63
      ctx.drawImage(wall.image, 0, 0, 1024, 1024)
    })
    const weave = paintedTexture(192, 192, ctx => {
      const random = randomFrom(806)
      ctx.fillStyle = '#929292'
      ctx.fillRect(0, 0, 192, 192)
      for (let y = 0; y < 192; y += 3) {
        for (let x = 0; x < 192; x += 3) {
          const light = 128 + ((x + y) % 2 ? 15 : -15) + Math.floor(random() * 20)
          ctx.fillStyle = `rgb(${light}, ${light}, ${light})`
          ctx.fillRect(x, y, 2, 2)
        }
      }
    })
    weave.colorSpace = NoColorSpace
    weave.wrapS = weave.wrapT = RepeatWrapping
    weave.repeat.set(1.5, 1.5)
    const concrete = paintedTexture(512, 512, ctx => {
      ctx.fillStyle = '#ded9cc'
      ctx.fillRect(0, 0, 512, 512)
      ctx.globalAlpha = .29
      ctx.drawImage(road.image, 0, 0, 512, 512)
    })
    concrete.wrapS = concrete.wrapT = RepeatWrapping
    concrete.repeat.set(25, 3)
    const redWood = paintedTexture(1024, 1024, ctx => {
      ctx.fillStyle = '#ead5c2'
      ctx.fillRect(0, 0, 1024, 1024)
      ctx.globalAlpha = .56
      ctx.drawImage(wood.image, 0, 0, 1024, 1024)
      ctx.globalAlpha = 1

      const grain = randomFrom(583)
      for (let i = 0; i < 560; i++) {
        const x = grain() * 1024
        const y = grain() * 1024
        const length = 12 + grain() * 135
        ctx.lineWidth = .45 + grain() * .88
        ctx.strokeStyle = `rgba(${i % 3 ? '66,33,20' : '250,230,194'},${.022 + grain() * .083})`
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.bezierCurveTo(x + length * .31, y + 2, x + length * .76, y - 2, x + length, y + 1)
        ctx.stroke()
      }
    })
    const redWoodNormal = timberNormal.clone()
    const redWoodRoughness = roughnessFrom(wood.image, .29, .72)
    for (const map of [redWood, redWoodNormal, redWoodRoughness]) {
      map.center.set(.5, .5)
      map.rotation = Math.PI / 2
      map.anisotropy = 8
      map.needsUpdate = true
    }

    const stuccoRoughness = roughnessFrom(wall.image, .77, 1)

    return {
      plaster: { map: plaster, normalMap: wallNormal, normalScale: new Vector2(.32, .32), roughnessMap: stuccoRoughness, roughness: 1 },
      wood: { map: wood, normalMap: timberNormal, normalScale: new Vector2(.26, .26), roughness: .57 },
      asphalt: { map: road, normalMap: roadNormal, normalScale: new Vector2(.49, .49), roughness: .96 },
      roadConcrete: { map: concrete, normalMap: roadNormal, normalScale: new Vector2(.28, .28), roughness: .97 },
      redWood: { map: redWood, normalMap: redWoodNormal, normalScale: new Vector2(.26, .26), roughnessMap: redWoodRoughness, roughness: .9 },
      fabric: { bumpMap: weave, bumpScale: .008, roughness: .96 },
    }
  }, [wall, wallNormal, wood, timberNormal, road, roadNormal])

  useEffect(() => () => {
    surfaces.plaster.map.dispose()
    surfaces.plaster.roughnessMap.dispose()
    surfaces.fabric.bumpMap.dispose()
    surfaces.roadConcrete.map.dispose()
    surfaces.redWood.map.dispose()
    surfaces.redWood.normalMap.dispose()
    surfaces.redWood.roughnessMap.dispose()
  }, [surfaces])

  return surfaces
}

export function paintedTexture(width, height, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext('2d'))
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export function randomFrom(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
}
