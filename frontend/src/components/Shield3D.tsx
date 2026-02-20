import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Earth = () => {
  const group = useRef<THREE.Group>(null)
  const rings = useRef<THREE.Mesh[]>([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) {
      // Slow, subtle rotation for premium feel
      group.current.rotation.y = Math.sin(t / 12) * 0.08
      group.current.rotation.x = Math.sin(t / 18) * 0.04
    }

    // animate rings with a smooth, out-of-phase motion
    rings.current.forEach((r, i) => {
      if (!r) return
      r.rotation.z = Math.sin(t / (8 + i * 2)) * 0.2 + i * 0.2
    })
  })

  return (
    <group ref={group}>
      {/* Dark Earth sphere */}
      <mesh>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshStandardMaterial
          color="#071422"
          roughness={0.7}
          metalness={0.05}
          emissive="#05202a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* subtle atmosphere glow */}
      <mesh scale={1.06}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial color="#0b2b36" transparent opacity={0.12} />
      </mesh>

      {/* multiple orbital security rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (rings.current[i] = el as THREE.Mesh)}
          rotation={[i === 0 ? Math.PI / 4 : 0, i === 1 ? Math.PI / 5 : 0, i * 0.5]}
          position={[0, 0, 0]}
        >
          <torusGeometry args={[1.6 - i * 0.15, 0.02 + i * 0.01, 16, 256]} />
          <meshBasicMaterial color={i === 0 ? '#1de9b6' : '#00bcd4'} transparent opacity={0.12 - i * 0.02} />
        </mesh>
      ))}

      {/* small accent points */}
      <mesh position={[0.9, 0.2, 0.6]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#1de9b6" emissive="#1de9b6" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.8, -0.25, -0.5]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#00bcd4" emissive="#00bcd4" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

const ShieldScene = () => {
  return (
    <div className="w-full h-full">
      <Canvas className="w-full h-full">
        <perspectiveCamera makeDefault position={[0, 0, 4]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -3, -2]} intensity={0.3} color="#00bcd4" />
        <Earth />
      </Canvas>
    </div>
  )
}

export default ShieldScene
