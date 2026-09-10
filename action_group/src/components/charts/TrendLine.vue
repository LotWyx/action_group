<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    points: { label: string; value: number }[]
    height?: number
    color?: string
  }>(),
  { height: 160, color: 'var(--color-primary)' },
)

const width = 480
const padding = 24

const maxValue = computed(() => Math.max(1, ...props.points.map((p) => p.value)))

const coords = computed(() => {
  const n = props.points.length
  if (n === 0) return []
  const step = n > 1 ? (width - padding * 2) / (n - 1) : 0
  return props.points.map((p, i) => {
    const x = padding + step * i
    const y = props.height - padding - (p.value / maxValue.value) * (props.height - padding * 2)
    return { x, y, ...p }
  })
})

const linePath = computed(() =>
  coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' '),
)

const areaPath = computed(() => {
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  if (!first || !last) return ''
  return `${linePath.value} L ${last.x} ${props.height - padding} L ${first.x} ${props.height - padding} Z`
})
</script>

<template>
  <svg v-if="points.length" :viewBox="`0 0 ${width} ${height}`" class="trend" preserveAspectRatio="none">
    <path :d="areaPath" :fill="color" opacity="0.12" />
    <path :d="linePath" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    <circle v-for="(c, i) in coords" :key="i" :cx="c.x" :cy="c.y" r="3.5" :fill="color" />
  </svg>
</template>

<style scoped>
.trend {
  width: 100%;
  height: auto;
  display: block;
}
</style>
