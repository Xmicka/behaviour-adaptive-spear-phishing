import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Earth = () => {
  const group = useRef<THREE.Group>(null)
  const earthRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (group.current) {
      // Gentle rotation like Google Earth
      group.current.rotation.y = t * 0.08
      group.current.rotation.x = Math.sin(t / 20) * 0.05
    }
    
    // Slightly faster cloud rotation
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = t * 0.09
    }
  })

  return (
    <group ref={group}>
      {/* Realistic Earth sphere with ocean blue and land colors */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshPhongMaterial
          color="#2e8b9e"
          emissive="#1a5a6f"
          emissiveIntensity={0.15}
          shininess={5}
          wireframe={false}
        />
        {/* Add continent pattern using canvas texture */}
        <meshPhongMaterial 
          map={createEarthTexture()} 
          emissive="#1a5a6f"
          emissiveIntensity={0.1}
          shininess={8}
        />
      </mesh>

      {/* Atmospheric glow - more pronounced */}
      <mesh scale={1.08} ref={atmosphereRef}>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshBasicMaterial 
          color="#87ceeb" 
          transparent 
          opacity={0.25}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh scale={1.05} ref={cloudsRef}>
        <sphereGeometry args={[1.25, 128, 128]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          metalness={0}
          roughness={1}
        />
      </mesh>

      {/* Soft rim light for depth */}
      <mesh scale={1.26}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial
          color="#4da8c0"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Glowing points for major cities */}
      <mesh position={[0.7, 0.3, 0.6]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial 
          color="#ff6b6b" 
          emissive="#ff6b6b" 
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-0.9, 0.1, 0.3]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial 
          color="#4ecdc4" 
          emissive="#4ecdc4" 
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh position={[0.2, -0.85, -0.3]}>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial 
          color="#95e1d3" 
          emissive="#95e1d3" 
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

// Create a simple Earth texture with continents
const createEarthTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // Ocean background
  ctx.fillStyle = '#2e8b9e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Land masses with gradient greens and browns
  ctx.fillStyle = '#228b4e'
  // North America
  ctx.fillRect(200, 200, 300, 250)
  // South America
  ctx.fillRect(280, 420, 150, 200)
  // Europe/Africa
  ctx.fillRect(700, 150, 400, 450)
  // Asia
  ctx.fillRect(1000, 180, 500, 350)
  // Australia
  ctx.fillRect(1300, 450, 150, 120)

  // Add some variation with lighter greens
  ctx.fillStyle = '#2d9b5a'
  ctx.fillRect(250, 230, 150, 100)
  ctx.fillRect(850, 200, 100, 150)
  ctx.fillRect(1150, 250, 120, 100)

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

const ShieldScene = () => {
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
