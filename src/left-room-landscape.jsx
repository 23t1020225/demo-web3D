import React, { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import { SphereGeometry, SRGBColorSpace, TextureLoader } from 'three'
import { Block, RepeatMeshes, Rounded } from './model-parts.jsx'
import { rectangularRing } from './reference-right-living.jsx'
import artUrl from './assets/left-landscape-reference.webp'

const leaf = new SphereGeometry(1, 8, 5)
const innerBead = rectangularRing(1.272, .657, 1.248, .633, .009)
const outerBead = rectangularRing(1.337, .713, 1.319, .695, .008)
const ornaments = [
  ...[-.341, .341].flatMap(y => Array.from({ length: 47 }, (_, i) => ({
    at: [-.621 + i * .027, y, .039],
    size: [.0095, .0035, .0027],
    rotation: [0, 0, (i % 2 ? .47 : -.47) * Math.sign(y)],
    color: i % 3 ? '#aa9362' : '#746542',
  }))),
  ...[-.651, .651].flatMap(x => Array.from({ length: 23 }, (_, i) => ({
    at: [x, -.305 + i * .027, .039],
    size: [.0035, .0095, .0027],
    rotation: [0, 0, i % 2 ? .44 : -.44],
    color: i % 3 ? '#aa9362' : '#746542',
  }))),
]

export function LeftLandscape() {
  const art = useLoader(TextureLoader, artUrl)
  useMemo(() => {
    art.colorSpace = SRGBColorSpace
    art.anisotropy = 8
    art.needsUpdate = true
  }, [art])

  return <group position={[-3.848, 2.10, -.65]} rotation-y={Math.PI / 2}>
    <Rounded at={[0, 0, -.008]} size={[1.357, .733, .057]} radius={.009} color="#29251e"
      finish={{ roughness: .38, envMapIntensity: .45 }} />
    <Block at={[0, 0, .018]} size={[1.310, .686, .015]} color="#3e3526" />
    <mesh geometry={outerBead} position-z={.027} castShadow>
      <meshStandardMaterial color="#7f6b43" metalness={.48} roughness={.39} />
    </mesh>
    <RepeatMeshes geometry={leaf} pieces={ornaments}
      finish={{ roughness: .37, metalness: .39 }} shadow={false} />
    <Block at={[0, 0, .030]} size={[1.285, .670, .016]} color="#24271f" />
    <mesh geometry={innerBead} position-z={.037}>
      <meshStandardMaterial color="#b39b63" metalness={.46} roughness={.41} />
    </mesh>
    <Block at={[0, 0, .044]} size={[1.240, .625, .009]} color="#c8c1a4" />
    <mesh position-z={.050} receiveShadow>
      <planeGeometry args={[1.222, .611]} />
      <meshStandardMaterial map={art} color="#f4f0e5" roughness={.57} envMapIntensity={.17} />
    </mesh>
    <mesh position-z={.051}>
      <planeGeometry args={[1.234, .619]} />
      <meshPhysicalMaterial color="#bfc9c2" transparent opacity={.025} depthWrite={false}
        roughness={.18} metalness={0} clearcoat={.24} clearcoatRoughness={.21} envMapIntensity={.35} />
    </mesh>
  </group>
}
