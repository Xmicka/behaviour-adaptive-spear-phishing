import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from 'framer-motion'

const Shield = () => {
  const meshRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003
      meshRef.current.rotation.x += 0.001
    }
  })

  return (
    <group ref={meshRef}>
      {/* Outer shield sphere with glow */}
      <mesh>
        <icosahedronGeometry args={[1.5, 4]} />
        <meshPhongMaterial
          color="#00d9ff"
          emissive="#0099cc"
          emissiveIntensity={0.3}
          wireframe={false}
          shininess={100}
        />
      </mesh>

      {/* Inner glow layer */}
      <mesh scale={0.98}>
        <icosahedronGeometry args={[1.5, 4]} />
        <meshBasicMaterial
          color="#0099cc"
          transparent={true}
          opacity={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Wireframe layer */}
      <mesh scale={1.02}>
        <icosahedronGeometry args={[1.5, 4]} />
        <meshBasicMaterial
          color="#00d9ff"
          transparent={true}
          opacity={0.1}
          wireframe={true}
        />
      </mesh>

      {/* Center accent orb */}
      <mesh position={[0, -0.1, 0.5]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshPhongMaterial
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Rotating rings */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.8, 0.1, 16, 100]} />
        <meshPhongMaterial
          color="#00d9ff"
          emissive="#0099cc"
          emissiveIntensity={0.2}
        />
      </mesh>

      <mesh rotation={[0, Math.PI / 3, Math.PI / 6]}>
        <torusGeometry args={[1.6, 0.08, 16, 100]} />
        <meshBasicMaterial
          color="#0099cc"
          transparent={true}
          opacity={0.15}
        />
      </mesh>
    </group>
  )
}

const ShieldScene = () => {
  return (
    <div className="w-full h-full">
      <Canvas className="w-full h-full">
        <perspectiveCamera makeDefault position={[0, 0, 3]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 10]} intensity={0.5} color="#0099cc" />
        <Shield />
      </Canvas>
    </div>
  )
}

export default ShieldScene
