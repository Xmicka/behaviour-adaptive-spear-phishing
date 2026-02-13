import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Mesh, Color } from 'three'

// ShieldScene: 3D rotating shield that reflects average risk.
// Very slow rotation and color mapping to avoid flashy effects.
function Shield({ avgRisk = 0.4 }:{avgRisk:number}){
  const ref = useRef<Mesh>()
  useFrame((state, delta) => {
    if(ref.current){
      // very slow rotation
      ref.current.rotation.y += delta * 0.08
    }
  })
  // Map risk to color: low risk -> cyan-green, high risk -> muted red
  const color = new Color().setHSL((1 - Math.min(1, avgRisk)) * 0.45, 0.7, 0.5)
  return (
    <mesh ref={ref} rotation={[0,0,0]}>
      <icosahedronBufferGeometry args={[1.2, 2]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
    </mesh>
  )
}

export default function ShieldScene({ avgRisk }:{ avgRisk:number }){
  return (
    <Canvas camera={{ position: [0, 0, 4] }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5,5,5]} intensity={0.6} />
      <Shield avgRisk={avgRisk} />
    </Canvas>
  )
}
