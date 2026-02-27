import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Creates a simple procedural Earth texture on a canvas.
 * Called once and memoized to avoid re-creating the 2048×1024 canvas per render.
 */
const createEarthTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // Ocean background
  ctx.fillStyle = '#2e8b9e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Land masses
  ctx.fillStyle = '#228b4e'
  ctx.fillRect(200, 200, 300, 250)   // North America
  ctx.fillRect(280, 420, 150, 200)   // South America
  ctx.fillRect(700, 150, 400, 450)   // Europe/Africa
  ctx.fillRect(1000, 180, 500, 350)  // Asia
  ctx.fillRect(1300, 450, 150, 120)  // Australia

  // Lighter green variation
  ctx.fillStyle = '#2d9b5a'
  ctx.fillRect(250, 230, 150, 100)
  ctx.fillRect(850, 200, 100, 150)
  ctx.fillRect(1150, 250, 120, 100)

  return new THREE.CanvasTexture(canvas)
}

const Earth: React.FC = () => {
  const group = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  // Memoize the texture so it's computed once
  const earthTexture = useMemo(() => createEarthTexture(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) {
      group.current.rotation.y = t * 0.08
      group.current.rotation.x = Math.sin(t / 20) * 0.05
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.09
    }
  })

  return (
    <group ref={group}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshPhongMaterial
          map={earthTexture}
          emissive="#1a5a6f"
          emissiveIntensity={0.1}
          shininess={8}
        />
      </mesh>

      {/* Atmospheric glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshBasicMaterial color="#87ceeb" transparent opacity={0.25} side={THREE.BackSide} />
      </mesh>

      {/* Cloud layer */}
      <mesh scale={1.05} ref={cloudsRef}>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} metalness={0} roughness={1} />
      </mesh>

      {/* Soft rim light */}
      <mesh scale={1.26}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial color="#4da8c0" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>

      {/* City marker dots */}
      <mesh position={[0.7, 0.3, 0.6]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.9, 0.1, 0.3]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0.2, -0.85, -0.3]}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial color="#95e1d3" emissive="#95e1d3" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

const ShieldScene: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Canvas className="w-full h-full">
        <perspectiveCamera makeDefault position={[0, 0, 3.5]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[8, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-8, -3, -5]} intensity={0.5} color="#87ceeb" />
        <pointLight position={[0, 2, 2]} intensity={0.3} color="#4da8c0" />
        <Earth />
      </Canvas>
    </div>
  )
}

export default ShieldScene
