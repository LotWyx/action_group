<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  accent: string
  points: { label: string; value: number }[]
  /** Short "куда движемся" подпись под цифрой — например, сравнение с
   * пиковым значением. Направление задаёт вызывающий код (что "хорошо"
   * для одной метрики — "плохо" для другой), сам компонент этого не знает. */
  caption?: string | null
  captionGood?: boolean
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

/** Smooths a polyline into quadratic-Bezier curves through the midpoint of
 * each pair of neighbours — the curve still passes exactly through the
 * first and last points, and stays within each triple's bounding area (no
 * Catmull-Rom-style overshoot above/below the real values). Also returns
 * just the final visible segment, so it can be redrawn in the accent
 * color on top of the muted history. */
function buildSmoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return { full: '', tail: '' }
  if (pts.length === 1) return { full: `M ${pts[0]!.x} ${pts[0]!.y}`, tail: '' }

  let full = `M ${pts[0]!.x} ${pts[0]!.y}`
  let tailStart = pts[0]!
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!
    const next = pts[i + 1]!
    const midX = (p.x + next.x) / 2
    const midY = (p.y + next.y) / 2
    full += ` Q ${p.x} ${p.y} ${midX} ${midY}`
    tailStart = { x: midX, y: midY }
  }
  const secondLast = pts[pts.length - 2]!
  const last = pts[pts.length - 1]!
  full += ` Q ${secondLast.x} ${secondLast.y} ${last.x} ${last.y}`
  const tail = `M ${tailStart.x} ${tailStart.y} Q ${secondLast.x} ${secondLast.y} ${last.x} ${last.y}`
  return { full, tail }
}

const smoothed = computed(() => buildSmoothPath(coords.value))
const linePath = computed(() => smoothed.value.full)
const areaPath = computed(() => {
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  if (!first || !last) return ''
  return `${linePath.value} L ${last.x} ${baselineY.value} L ${first.x} ${baselineY.value} Z`
})
// Спек анатомии: история — приглушённым цветом, только последний отрезок
// (текущее состояние) — акцентным, чтобы не перегружать цветом маленький
// инлайн-график.
const lastSegment = computed(() => smoothed.value.tail)
const lastPoint = computed(() => coords.value[coords.value.length - 1] ?? null)

// Сглаженная кривая, растянутая по своему же максимуму, слабо показывает
// спад в несколько единиц на глаз — отмечаем сам пик отдельной точкой,
// чтобы «график пошёл вниз с пика» было видно, а не только читалось в
// подписи под цифрой.
const peakPoint = computed(() => {
  const pts = coords.value
  if (pts.length < 2) return null
  const last = pts[pts.length - 1]!
  let peak = pts[0]!
  for (const p of pts) if (p.value > peak.value) peak = p
  return peak.value > last.value ? peak : null
})

const firstLabel = computed(() => props.points[0]?.label ?? '')
const lastLabel = computed(() => props.points[props.points.length - 1]?.label ?? '')
</script>

<template>
  <div class="stat-trend">
    <p class="stat-trend__label">{{ label }}</p>
    <div class="stat-trend__row">
      <p class="stat-trend__value">{{ value }}</p>
      <p v-if="caption" class="stat-trend__caption" :class="{ 'is-good': captionGood }">{{ caption }}</p>
    </div>
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
      <template v-if="peakPoint">
        <circle :cx="peakPoint.x" :cy="peakPoint.y" r="3" fill="var(--color-text-faint)"><title>Пик: {{ peakPoint.value }}</title></circle>
      </template>
      <template v-if="lastPoint">
        <circle :cx="lastPoint.x" :cy="lastPoint.y" r="6" fill="var(--color-surface)" />
        <circle :cx="lastPoint.x" :cy="lastPoint.y" r="4" :fill="accent" />
      </template>
      <g v-for="(c, i) in coords" :key="i">
        <circle :cx="c.x" :cy="c.y" r="8" fill="transparent"><title>{{ c.label }}: {{ c.value }}</title></circle>
      </g>
    </svg>
    <div v-if="points.length > 1" class="stat-trend__axis">
      <span>{{ firstLabel }}</span>
      <span>{{ lastLabel }}</span>
    </div>
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
.stat-trend__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-trend__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
}
.stat-trend__caption {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.stat-trend__caption.is-good {
  color: var(--color-success);
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
.stat-trend__axis {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-faint);
  margin-top: 2px;
}
</style>
