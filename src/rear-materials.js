import { useEffect, useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import { paintedTexture, randomFrom } from './surfaces.js'
import doorLeafUrl from './assets/rear/door-leaf.webp'
import transomUrl from './assets/rear/door-transom.webp'
import brickUrl from './assets/rear/privacy-brick.webp'
import diamondUrl from './assets/rear/privacy-diamond.webp'
import cabinetFrontUrl from './assets/rear/cabinet-front.webp'
import cabinetSideUrl from './assets/rear/cabinet-side.webp'
import marbleUrl from './assets/rear/cabinet-marble.webp'
import oatsUrl from './assets/rear/oats.webp'
import wallUrl from './assets/rear/wall-porcelain.webp'
import floorUrl from './assets/rear/floor-porcelain.webp'
import daylightUrl from './assets/rear/window-daylight.webp'

const urls = [doorLeafUrl, transomUrl, brickUrl, diamondUrl, cabinetFrontUrl, cabinetSideUrl, marbleUrl, oatsUrl, wallUrl, floorUrl, daylightUrl]

export function useRearMaterials() {
  const maps = useLoader(TextureLoader, urls)
  return useMemo(() => {
    maps.forEach(map => { map.colorSpace = SRGBColorSpace; map.anisotropy = 8 })
    const [doorLeaf, transom, brick, diamond, cabinetFront, cabinetSide, marble, oats, wall, floor, daylight] = maps
    return { doorLeaf, transom, brick, diamond, cabinetFront, cabinetSide, marble, oats, daylight,
      tile: { map: wall, roughness: .38, envMapIntensity: .26 },
      floor: { map: floor, roughness: .34, envMapIntensity: .30 },
      wood: { roughness: .59, envMapIntensity: .18 },
    }
  }, [maps])
}

export function useRearDetailMaps() {
  const maps = useMemo(() => {
    const fabric = paintedTexture(384, 384, ctx => {
      const random = randomFrom(729)
      ctx.fillStyle = '#777777'
      ctx.fillRect(0, 0, 384, 384)
      for (let i = 0; i < 26000; i++) {
        const tone = Math.floor(65 + random() * 135)
        ctx.strokeStyle = `rgb(${tone},${tone},${tone})`
        ctx.lineWidth = .55 + random() * .8
        const x = random() * 384, y = random() * 384
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 2, y + 1 + random() * 4); ctx.stroke()
      }
    })
    fabric.colorSpace = NoColorSpace
    fabric.wrapS = fabric.wrapT = RepeatWrapping
    fabric.repeat.set(2, 2)
    const umbrella = paintedTexture(256, 512, ctx => {
      const random = randomFrom(459)
      ctx.fillStyle = '#358c40'; ctx.fillRect(0, 0, 256, 512)
      for (let x = 0; x < 256; x += 32) {
        const fold = ctx.createLinearGradient(x, 0, x + 32, 0)
        fold.addColorStop(0, '#1c622d'); fold.addColorStop(.45, '#61a65d'); fold.addColorStop(1, '#2c7c35')
        ctx.fillStyle = fold; ctx.fillRect(x, 0, 32, 512)
      }
      ctx.fillStyle = '#e0e8d4'
      for (let i = 0; i < 14; i++) {
        ctx.save(); ctx.translate(random() * 256, 90 + random() * 320); ctx.rotate(-.6)
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 29, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      ctx.fillRect(0, 126, 256, 15)
    })
    const contact = paintedTexture(128, 128, ctx => {
      const shade = ctx.createRadialGradient(64, 64, 10, 64, 64, 64)
      shade.addColorStop(0, 'rgba(34,38,33,.32)'); shade.addColorStop(.55, 'rgba(34,38,33,.12)'); shade.addColorStop(1, 'rgba(34,38,33,0)')
      ctx.fillStyle = shade; ctx.fillRect(0, 0, 128, 128)
    })
    return { fabric, umbrella, contact }
  }, [])
  useEffect(() => () => Object.values(maps).forEach(map => map.dispose()), [maps])
  return maps
}
