<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    points: { label: string; value: number; delta: number }[]
    height?: number
  }>(),
  { height: 160 },
)

const width = 480
const padding = 24
const gap = 4

const domain = computed(() => {
  const values = props.points.map((p) => p.value)
  const min = Math.min(0, ...values)
  const max = Math.max(0, ...values)
  return max === min ? { min: min - 1, max: max + 1 } : { min, max }
})

const plotHeight = computed(() => props.height - padding * 2)

function valueToY(value: number) {
  const { min, max } = domain.value
  return padding + ((max - value) / (max - min)) * plotHeight.value
}

const zeroY = computed(() => valueToY(0))

const bars = computed(() => {
  const n = props.points.length
  if (n === 0) return []
  const slot = (width - padding * 2) / n
  const barWidth = Math.max(2, slot - gap)
  return props.points.map((p, i) => {
    const x = padding + slot * i + (slot - barWidth) / 2
    const y = Math.min(valueToY(p.value), zeroY.value)
    const h = Math.max(1.5, Math.abs(valueToY(p.value) - zeroY.value))
    const color =
      i === 0 ? 'var(--color-text-faint)' : p.delta > 0 ? 'var(--color-success)' : p.delta < 0 ? 'var(--color-danger)' : 'var(--color-primary)'
    return { x, y, width: barWidth, height: h, color, ...p }
  })
})
</script>

<template>
  <svg v-if="points.length" :viewBox="`0 0 ${width} ${height}`" class="trend-bars" preserveAspectRatio="none">
    <line :x1="padding" :x2="width - padding" :y1="zeroY" :y2="zeroY" class="zero-line" />
    <g v-for="(b, i) in bars" :key="i">
      <rect :x="b.x" :y="b.y" :width="b.width" :height="b.height" :fill="b.color" rx="2" />
      <title>{{ b.label }}: {{ b.value }}{{ i > 0 ? ` (${b.delta > 0 ? '+' : ''}${b.delta})` : '' }}</title>
    </g>
  </svg>
</template>

<style scoped>
.trend-bars {
  width: 100%;
  height: auto;
  display: block;
}
.zero-line {
  stroke: var(--color-border);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
</style>
