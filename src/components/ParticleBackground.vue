<template>
  <canvas ref="canvas" class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 1;"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
let animationId = null

onMounted(() => {
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')

  let particles = []
  let w, h

  const resize = () => {
    w = c.width = c.offsetWidth
    h = c.height = c.offsetHeight
    initParticles()
  }

  const createParticle = (randomY = false) => ({
    x: Math.random() * w,
    y: randomY ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + 0.4,
    speed: Math.random() * 0.35 + 0.12,
    opacity: Math.random() * 0.45 + 0.12,
    drift: (Math.random() - 0.5) * 0.25,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.02 + 0.008,
  })

  const initParticles = () => {
    particles = Array.from({ length: 70 }, () => createParticle(true))
  }

  const draw = () => {
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      p.pulse += p.pulseSpeed
      const alpha = p.opacity + Math.sin(p.pulse) * 0.08
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`
      ctx.fill()
      p.y -= p.speed
      p.x += p.drift
      if (p.y < -6 || p.x < -10 || p.x > w + 10) {
        Object.assign(p, createParticle(false))
      }
    }
    animationId = requestAnimationFrame(draw)
  }

  resize()
  window.addEventListener('resize', resize)
  draw()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', () => {})
})
</script>
