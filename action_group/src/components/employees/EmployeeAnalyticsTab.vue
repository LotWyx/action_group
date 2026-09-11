<script setup lang="ts">
import { computed } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { useSkillsStore } from '@/stores/skills'
import type { User } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DonutProgress from '@/components/charts/DonutProgress.vue'
import StatTrend from '@/components/charts/StatTrend.vue'
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

/** Turns a map of {date -> delta} into a running total over time, starting
 * from a true zero before anything happened — a plain, literal count a
 * manager reads at a glance, not an abstract score. */
function buildSeries(byDate: Map<string, number>, clampAtZero = false) {
  const dates = [...byDate.keys()].sort()
  const points = [{ label: 'Старт', value: 0 }]
  let cumulative = 0
  for (const date of dates) {
    cumulative += byDate.get(date) ?? 0
    if (clampAtZero) cumulative = Math.max(0, cumulative)
    points.push({ label: formatShortDate(date), value: cumulative })
  }
  return points
}

// Сколько навыков подтверждено на сегодня, по датам встреч — всегда растёт.
const skillsSeries = computed(() => {
  const byDate = new Map<string, number>()
  for (const m of meetings.forUser(props.employee.id)) {
    const confirmed = m.skillMarks.filter((s) => s.confirmed).length
    if (confirmed) byDate.set(m.date, (byDate.get(m.date) ?? 0) + confirmed)
  }
  return buildSeries(byDate)
})

// Сколько проблем сейчас открыто: явные проблемы со встреч (пока не
// отмечены решёнными) и навыки с просроченной плановой датой, которые ещё
// не подтвердили. Число реально открытых проблем на сегодня — растёт,
// когда проблема появляется, и падает, когда её закрывают/подтверждают.
const issuesSeries = computed(() => {
  const byDate = new Map<string, number>()
  const bump = (date: string, delta: number) => byDate.set(date, (byDate.get(date) ?? 0) + delta)

  for (const m of meetings.forUser(props.employee.id)) {
    for (const p of m.problems) {
      bump(m.date, 1)
      if (p.resolved && p.resolvedAt) bump(p.resolvedAt, -1)
    }
  }
  for (const item of items.value) {
    if (item.status === 'problem') {
      bump(item.plannedDate, 1)
    } else if (item.confirmedDate && item.confirmedDate > item.plannedDate) {
      bump(item.plannedDate, 1)
      bump(item.confirmedDate, -1)
    }
  }
  return buildSeries(byDate, true)
})

const openIssuesCount = computed(() => {
  const unresolvedFromMeetings = meetings
    .forUser(props.employee.id)
    .flatMap((m) => m.problems)
    .filter((p) => !p.resolved).length
  return unresolvedFromMeetings + overdue.value.length
})

const hasTrendData = computed(() => skillsSeries.value.length > 1 || issuesSeries.value.length > 1)
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
      <p class="text-sm text-muted" style="margin-bottom: 14px">Динамика</p>
      <div v-if="hasTrendData" class="trend-grid">
        <StatTrend label="Подтверждено навыков" :value="confirmedCount" accent="var(--color-success)" :points="skillsSeries" />
        <StatTrend label="Проблемы и просрочки" :value="openIssuesCount" accent="var(--color-danger)" :points="issuesSeries" />
      </div>
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
.trend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
  .trend-grid {
    grid-template-columns: 1fr !important;
    gap: 20px !important;
  }
}
</style>
