import React, { useRef, useEffect, useCallback } from 'react'

/**
 * Lightweight canvas-based particle cloud inspired by MazeHQ.
 * Renders a swirling particle atmosphere with cyan and purple hues.
 * No Three.js dependency — pure Canvas 2D.
 */

interface Particle {
    x: number
    y: number
    z: number       // depth for parallax
    size: number
    speed: number
    angle: number
    orbit: number
    hue: number     // 180 = cyan, 270 = purple
    alpha: number
}

const PARTICLE_COUNT = 200
const CENTER_GLOW_RADIUS = 120

function createParticles(w: number, h: number): Particle[] {
    const particles: Particle[] = []
    const cx = w / 2
    const cy = h / 2

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const orbit = 40 + Math.random() * Math.min(cx, cy) * 0.85
        const angle = Math.random() * Math.PI * 2
        const z = Math.random()
        particles.push({
            x: cx + Math.cos(angle) * orbit,
            y: cy + Math.sin(angle) * orbit * 0.6, // elliptical
            z,
            size: 1 + Math.random() * 2.5 * (0.5 + z * 0.5),
            speed: 0.0008 + Math.random() * 0.0015,
            angle,
            orbit,
            hue: Math.random() > 0.4 ? 190 : 270, // cyan or purple
            alpha: 0.2 + Math.random() * 0.6,
        })
    }
    return particles
}

const ParticleCloud: React.FC<{ className?: string }> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const frameRef = useRef<number>(0)
    const sizeRef = useRef({ w: 0, h: 0 })

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { w, h } = sizeRef.current
        const cx = w / 2
        const cy = h / 2

        ctx.clearRect(0, 0, w, h)

        // Central glow
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, CENTER_GLOW_RADIUS)
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.12)')
        gradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.06)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)

        // Outer atmospheric haze
        const haze = ctx.createRadialGradient(cx, cy, CENTER_GLOW_RADIUS * 0.5, cx, cy, Math.min(cx, cy) * 0.9)
        haze.addColorStop(0, 'rgba(34, 211, 238, 0.03)')
        haze.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)')
        haze.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = haze
        ctx.fillRect(0, 0, w, h)

        // Update & draw particles
        const particles = particlesRef.current
        for (const p of particles) {
            p.angle += p.speed
            p.x = cx + Math.cos(p.angle) * p.orbit
            p.y = cy + Math.sin(p.angle) * p.orbit * 0.6

            // Depth-based size and alpha
            const depthAlpha = 0.3 + p.z * 0.7
            const a = p.alpha * depthAlpha

            // Draw particle
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${a})`
            ctx.fill()

            // Glow for larger particles
            if (p.size > 2) {
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${a * 0.1})`
                ctx.fill()
            }
        }

        // Connection lines between close particles (subtle web effect)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)'
        ctx.lineWidth = 0.5
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x
                const dy = particles[i].y - particles[j].y
                const dist = dx * dx + dy * dy
                if (dist < 3600) { // 60px threshold
                    ctx.beginPath()
                    ctx.moveTo(particles[i].x, particles[i].y)
                    ctx.lineTo(particles[j].x, particles[j].y)
                    ctx.stroke()
                }
            }
        }

        frameRef.current = requestAnimationFrame(draw)
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect()
            if (!rect) return
            const dpr = window.devicePixelRatio || 1
            const w = rect.width
            const h = rect.height
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            const ctx = canvas.getContext('2d')
            ctx?.scale(dpr, dpr)
            sizeRef.current = { w, h }
            particlesRef.current = createParticles(w, h)
        }

        resize()
        window.addEventListener('resize', resize)
        frameRef.current = requestAnimationFrame(draw)

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(frameRef.current)
        }
    }, [draw])

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
    )
}

export default ParticleCloud
