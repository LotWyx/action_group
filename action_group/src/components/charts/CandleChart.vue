<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    candles: { label: string; open: number; close: number; breakdown: string }[]
    height?: number
  }>(),
  { height: 140 },
)

const width = 480
const padding = 18
const gap = 4

// В отличие от спарклайна, который растягивался по своему же максимуму (и
// тем самым прятал небольшие провалы), здесь у каждой свечи высота — это
// её РЕАЛЬНАЯ величина движения (open -> close), а не доля от общего
// диапазона. Ноль всегда попадает в область графика как опорная линия.
const domain = computed(() => {
  const values = props.candles.flatMap((c) => [c.open, c.close])
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
  const n = props.candles.length
  if (n === 0) return []
  const slot = (width - padding * 2) / n
  const barWidth = Math.max(3, Math.min(24, slot - gap))
  return props.candles.map((c, i) => {
    const x = padding + slot * i + (slot - barWidth) / 2
    const yOpen = valueToY(c.open)
    const yClose = valueToY(c.close)
    const y = Math.min(yOpen, yClose)
    const h = Math.max(2, Math.abs(yOpen - yClose))
    const good = c.close >= c.open
    return { x, y, width: barWidth, height: h, good, ...c }
  })
})
</script>

<template>
  <svg v-if="candles.length" :viewBox="`0 0 ${width} ${height}`" class="candles" preserveAspectRatio="none" role="img" aria-label="Динамика по встречам">
    <line :x1="padding" :x2="width - padding" :y1="zeroY" :y2="zeroY" class="candles__zero" />
    <g v-for="(b, i) in bars" :key="i">
      <rect :x="b.x" :y="b.y" :width="b.width" :height="b.height" :fill="b.good ? 'var(--color-success)' : 'var(--color-danger)'" rx="2" />
      <title>{{ b.label }}{{ b.breakdown ? ': ' + b.breakdown : ' — без изменений' }}</title>
    </g>
  </svg>
</template>

<style scoped>
.candles {
  width: 100%;
  height: 140px;
  display: block;
}
.candles__zero {
  stroke: var(--color-border);
  stroke-width: 1;
}
</style>
