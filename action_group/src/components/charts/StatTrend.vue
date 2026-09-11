<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  accent: string
  points: { label: string; value: number }[]
}>()

const width = 240
const height = 56
const padding = 6

const domain = computed(() => {
  const values = props.points.map((p) => p.value)
  return { min: 0, max: Math.max(1, ...values) }
})

const coords = computed(() => {
  const n = props.points.length
  if (n === 0) return []
  const { min, max } = domain.value
  const step = n > 1 ? (width - padding * 2) / (n - 1) : 0
  return props.points.map((p, i) => {
    const x = padding + step * i
    const y = height - padding - ((p.value - min) / (max - min || 1)) * (height - padding * 2)
    return { x, y, ...p }
  })
})

const baselineY = computed(() => height - padding)
const linePath = computed(() => coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' '))
const areaPath = computed(() => {
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  if (!first || !last) return ''
  return `${linePath.value} L ${last.x} ${baselineY.value} L ${first.x} ${baselineY.value} Z`
})
// Спек анатомии: история — приглушённым цветом, только последний отрезок
// (текущее состояние) — акцентным, чтобы не перегружать цветом маленький
// инлайн-график.
const lastSegment = computed(() => {
  const pts = coords.value
  if (pts.length < 2) return ''
  const a = pts[pts.length - 2]!
  const b = pts[pts.length - 1]!
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
})
const lastPoint = computed(() => coords.value[coords.value.length - 1] ?? null)
</script>

<template>
  <div class="stat-trend">
    <p class="stat-trend__label">{{ label }}</p>
    <p class="stat-trend__value">{{ value }}</p>
    <svg
      v-if="points.length > 1"
      :viewBox="`0 0 ${width} ${height}`"
      class="stat-trend__spark"
      preserveAspectRatio="none"
      role="img"
      :aria-label="label"
    >
      <line :x1="padding" :x2="width - padding" :y1="baselineY" :y2="baselineY" class="stat-trend__baseline" />
      <path :d="areaPath" :fill="accent" opacity="0.1" />
      <path :d="linePath" fill="none" stroke="var(--color-border)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <path :d="lastSegment" fill="none" :stroke="accent" stroke-width="2.5" stroke-linecap="round" />
      <template v-if="lastPoint">
        <circle :cx="lastPoint.x" :cy="lastPoint.y" r="6" fill="var(--color-surface)" />
        <circle :cx="lastPoint.x" :cy="lastPoint.y" r="4" :fill="accent" />
      </template>
      <g v-for="(c, i) in coords" :key="i">
        <circle :cx="c.x" :cy="c.y" r="8" fill="transparent"><title>{{ c.label }}: {{ c.value }}</title></circle>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.stat-trend {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-trend__label {
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.stat-trend__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
}
.stat-trend__spark {
  width: 100%;
  height: 48px;
  display: block;
  margin-top: 6px;
}
.stat-trend__baseline {
  stroke: var(--color-border);
  stroke-width: 1;
}
</style>
