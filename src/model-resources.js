import { CylinderGeometry, MeshStandardMaterial } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const geometries = new Map()
const materials = new Map()
const roundedKey = values => values.map(v => Math.round(v * 1e5) / 1e5).join(',')
function sharedGeometry(key, create) {
  if (!geometries.has(key)) geometries.set(key, create())
  return geometries.get(key)
}
export function roundedGeometry(size, radius) {
  return sharedGeometry(`box:${roundedKey([...size, radius])}`, () => new RoundedBoxGeometry(...size, 2, radius))
}
export function cylinderGeometry(top, bottom, height, sides = 16) {
  return sharedGeometry(`cyl:${roundedKey([top, bottom, height, sides])}`, () => new CylinderGeometry(top, bottom, height, sides))
}
function valueKey(value) {
  if (value?.isTexture) return value.uuid
  if (value?.toArray) return value.toArray()
  return value
}
export function standardMaterial(color = '#ffffff', roughness = .82, finish = {}) {
  const key = JSON.stringify([color, roughness, Object.entries(finish).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => [name, valueKey(value)])])
  if (!materials.has(key)) materials.set(key, new MeshStandardMaterial({ color, roughness, ...finish }))
  return materials.get(key)
}
