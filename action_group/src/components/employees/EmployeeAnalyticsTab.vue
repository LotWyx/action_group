<script setup lang="ts">
import { computed } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { useSkillsStore } from '@/stores/skills'
import type { User } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DonutProgress from '@/components/charts/DonutProgress.vue'
import CandleChart from '@/components/charts/CandleChart.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AchievementBadges from '@/components/employees/AchievementBadges.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AiAnalysisModal from '@/components/ui/AiAnalysisModal.vue'
import { Sparkles, TrendingUp } from '@lucide/vue'
import { useAiAnalysis } from '@/composables/useAiAnalysis'

const props = defineProps<{ employee: User }>()

const plans = usePlansStore()
const meetings = useMeetingsStore()
const skills = useSkillsStore()

const { show: aiShow, loading: aiLoading, error: aiError, text: aiText, open: openAiAnalysis } = useAiAnalysis(
  `/ai/employees/${props.employee.id}`,
)

const items = computed(() => plans.forUser(props.employee.id))
const confirmedCount = computed(() => items.value.filter((p) => p.status === 'confirmed').length)
const progress = computed(() => (items.value.length ? Math.round((confirmedCount.value / items.value.length) * 100) : 0))
const overdue = computed(() => items.value.filter((p) => p.status === 'problem'))

function formatShortDate(iso: string) {
  const [, month, day] = iso.split('-')
  return `${day}.${month}`
}

/** Russian plural form: 1 навык, 2 навыка, 5 навыков. */
function ru(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const openIssuesCount = computed(() => {
  const unresolvedFromMeetings = meetings
    .forUser(props.employee.id)
    .flatMap((m) => m.problems)
    .filter((p) => !p.resolved).length
  return unresolvedFromMeetings + overdue.value.length
})

interface DayEvent {
  skills: number
  opened: number
  closed: number
}

// Один общий график вместо двух: по каждой дате события считаем, сколько
// навыков подтвердили (+), сколько проблем/просрочек появилось (−) и
// сколько закрылось (+). Каждая "свеча" — это движение итогового счёта от
// значения до этого события к значению после него, поэтому высота столбика
// — реальная величина изменения, а не доля от общего максимума (как было
// раньше со спарклайнами) — провал в пару единиц виден так же чётко, как
// и рост.
const candles = computed(() => {
  const byDate = new Map<string, DayEvent>()
  const at = (date: string) => {
    let e = byDate.get(date)
    if (!e) {
      e = { skills: 0, opened: 0, closed: 0 }
      byDate.set(date, e)
    }
    return e
  }

  for (const m of meetings.forUser(props.employee.id)) {
    const confirmed = m.skillMarks.filter((s) => s.confirmed).length
    if (confirmed) at(m.date).skills += confirmed
    for (const p of m.problems) {
      at(m.date).opened += 1
      if (p.resolved && p.resolvedAt) at(p.resolvedAt).closed += 1
    }
  }
  for (const item of items.value) {
    if (item.status === 'problem') {
      at(item.plannedDate).opened += 1
    } else if (item.confirmedDate && item.confirmedDate > item.plannedDate) {
      at(item.plannedDate).opened += 1
      at(item.confirmedDate).closed += 1
    }
  }

  let cumulative = 0
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, e]) => {
      const open = cumulative
      cumulative += e.skills - e.opened + e.closed
      const parts: string[] = []
      if (e.skills) parts.push(`+${e.skills} ${ru(e.skills, 'навык', 'навыка', 'навыков')}`)
      if (e.opened) parts.push(`−${e.opened} ${ru(e.opened, 'проблема', 'проблемы', 'проблем')}`)
      if (e.closed) parts.push(`закрыто ${e.closed} ${ru(e.closed, 'проблема', 'проблемы', 'проблем')}`)
      return { label: formatShortDate(date), open, close: cumulative, breakdown: parts.join(', ') }
    })
})
</script>

<template>
  <div class="stack gap-lg">
    <div class="row" style="justify-content: flex-end">
      <BaseButton size="sm" variant="secondary" @click="openAiAnalysis">
        <Sparkles :size="14" /> AI-анализ
      </BaseButton>
    </div>

    <div class="grid" style="grid-template-columns: auto 1fr; align-items: center; gap: 24px">
      <BaseCard class="row" style="justify-content: center">
        <DonutProgress :value="progress" />
      </BaseCard>
      <BaseCard>
        <p class="text-sm text-muted">Навыков в плане</p>
        <p class="stat">{{ items.length }}</p>
        <div class="row gap-sm wrap" style="margin-top: 8px">
          <BaseBadge variant="success">{{ confirmedCount }} подтверждено</BaseBadge>
          <BaseBadge v-if="overdue.length" variant="danger">{{ overdue.length }} просрочено</BaseBadge>
        </div>
      </BaseCard>
    </div>

    <AchievementBadges :employee="employee" />

    <BaseCard>
      <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px">
        <p class="text-sm text-muted">Динамика по встречам</p>
        <div class="row gap-sm text-sm text-muted" style="align-items: center">
          <span class="legend-dot" style="background: var(--color-success)" /> прогресс
          <span class="legend-dot" style="background: var(--color-danger)" /> провал
        </div>
      </div>
      <template v-if="candles.length">
        <div class="row gap-sm wrap" style="margin-bottom: 12px">
          <BaseBadge variant="success">{{ confirmedCount }} {{ ru(confirmedCount, 'навык', 'навыка', 'навыков') }} подтверждено</BaseBadge>
          <BaseBadge v-if="openIssuesCount" variant="danger">
            {{ openIssuesCount }} {{ ru(openIssuesCount, 'открытая проблема', 'открытые проблемы', 'открытых проблем') }}
          </BaseBadge>
        </div>
        <CandleChart :candles="candles" />
      </template>
      <EmptyState v-else :icon="TrendingUp" title="Пока недостаточно данных" description="После первой встречи здесь появится график" />
    </BaseCard>

    <BaseCard v-if="overdue.length">
      <p class="text-sm text-muted" style="margin-bottom: 10px">Отставание от плановых дат</p>
      <ul class="lag-list">
        <li v-for="item in overdue" :key="item.id">
          <span>{{ skills.name(item.skillId) }}</span>
          <span class="text-sm text-danger">план: {{ item.plannedDate }}</span>
        </li>
      </ul>
    </BaseCard>

    <AiAnalysisModal v-if="aiShow" :loading="aiLoading" :error="aiError" :text="aiText" @close="aiShow = false" />
  </div>
</template>

<style scoped>
.stat {
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0;
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.lag-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
}
.lag-list li {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.lag-list li:last-child {
  border-bottom: none;
}
.text-danger {
  color: var(--color-danger);
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
