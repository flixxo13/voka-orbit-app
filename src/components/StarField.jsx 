// ============================================================
// VokaOrbit — src/components/StarField.jsx
// Canvas-basierter Sternenhintergrund für den Dark Mode.
// Zero Dependencies — nur native Canvas API.
// Sterne twinkeln mit zufälliger Opacity und Speed.
// ============================================================

import { useEffect, useRef } from 'react'

const STAR_COUNT = 80
const STAR_SIZES = [0.8, 1.0, 1.2, 1.5, 1.8]

function createStar(w, h) {
  return {
    x:            Math.random() * w,
    y:            Math.random() * h,
    size:         STAR_SIZES[Math.floor(Math.random() * STAR_SIZES.length)],
    opacity:      Math.random() * 0.45 + 0.15,   // 0.15 – 0.60
    targetOpacity:Math.random() * 0.45 + 0.15,
    speed:        Math.random() * 0.004 + 0.001,  // Twinkle-Speed
    color:        Math.random() > 0.85
      ? `rgba(167, 139, 250,`   // gelegentlich lila Sterne
      : Math.random() > 0.7
        ? `rgba(6, 182, 212,`   // gelegentlich cyan Sterne
        : `rgba(226, 232, 240,` // meistens weiß
  }
}

export default function StarField({ visible = true }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const starsRef  = useRef([])

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Sterne neu verteilen bei Resize
      starsRef.current = Array.from({ length: STAR_COUNT }, () =>
        createStar(canvas.width, canvas.height)
      )
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const star of starsRef.current) {
        // Twinkle: Opacity Richtung Ziel bewegen
        if (Math.abs(star.opacity - star.targetOpacity) < 0.01) {
          star.targetOpacity = Math.random() * 0.45 + 0.15
        }
        star.opacity += (star.targetOpacity - star.opacity) * star.speed * 10

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `${star.color}${star.opacity.toFixed(2)})`
        ctx.fill()

        // Glow für größere Sterne
        if (star.size >= 1.5) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `${star.color}${(star.opacity * 0.15).toFixed(2)})`
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [visible])

  if (!visible) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:   'fixed',
        inset:       0,
        width:       '100%',
        height:      '100%',
        pointerEvents: 'none',
        zIndex:      -1,
        opacity:     1,
      }}
    />
  )
}
