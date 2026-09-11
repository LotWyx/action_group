<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { useScheduledMeetingsStore } from '@/stores/scheduledMeetings'
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
const scheduledMeetings = useScheduledMeetingsStore()
const skills = useSkillsStore()

onMounted(() => scheduledMeetings.fetchAll())

const { show: aiShow, loading: aiLoading, error: aiError, text: aiText, open: openAiAnalysis } = useAiAnalysis(
  `/ai/employees/${props.employee.id}`,
)

const todayIso = new Date().toISOString().slice(0, 10)

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

const missedMeetings = computed(() => scheduledMeetings.forUser(props.employee.id).filter((m) => m.scheduledDate < todayIso))

const openIssuesCount = computed(() => {
  const unresolvedFromMeetings = meetings
    .forUser(props.employee.id)
    .flatMap((m) => m.problems)
    .filter((p) => !p.resolved).length
  return unresolvedFromMeetings + missedMeetings.value.length
})

interface DayEvent {
  delta: number
  parts: string[]
}

/**
 * Точные весовые правила графика:
 * 1. Новые проблемы со встречи — минус 1 за каждую.
 * 2. Закрытые проблемы (когда бы их ни закрыли) — плюс 1 за каждую.
 * 3. Пропущенная запланированная встреча — минус 1 за встречу.
 * 4. Подтверждённый на встрече навык — плюс 2 за навык.
 * 5. Провал повторной проверки УЖЕ подтверждённого навыка — минус 2.
 *    (Первый провал ещё не подтверждённого навыка — просто "обсудили",
 *    без веса: регресс — это именно потеря уже достигнутого.)
 */
const candles = computed(() => {
  const byDate = new Map<string, DayEvent>()
  const add = (date: string, delta: number, part: string) => {
    let e = byDate.get(date)
    if (!e) {
      e = { delta: 0, parts: [] }
      byDate.set(date, e)
    }
    e.delta += delta
    e.parts.push(part)
  }

  const employeeMeetings = meetings.forUser(props.employee.id)

  for (const m of employeeMeetings) {
    if (m.problems.length) {
      add(m.date, -m.problems.length, `−${m.problems.length} ${ru(m.problems.length, 'проблема', 'проблемы', 'проблем')}`)
    }
    for (const p of m.problems) {
      if (p.resolved && p.resolvedAt) add(p.resolvedAt, 1, 'закрыта 1 проблема')
    }
  }

  // Правила 4/5 требуют знать, был ли навык уже подтверждён РАНЬШЕ — идём
  // по встречам строго по датам и ведём состояние по каждому навыку.
  const confirmedSkills = new Set<string>()
  for (const m of employeeMeetings.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    for (const mark of m.skillMarks) {
      if (mark.confirmed) {
        add(m.date, 2, `+2 «${skills.name(mark.skillId)}»`)
        confirmedSkills.add(mark.skillId)
      } else if (confirmedSkills.has(mark.skillId)) {
        add(m.date, -2, `−2 провал повторной проверки «${skills.name(mark.skillId)}»`)
        confirmedSkills.delete(mark.skillId)
      }
    }
  }

  for (const sm of missedMeetings.value) {
    add(sm.scheduledDate, -1, 'пропущена запланированная встреча')
  }

  let cumulative = 0
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, e]) => {
      const open = cumulative
      cumulative += e.delta
      return { label: formatShortDate(date), open, close: cumulative, breakdown: e.parts.join(', ') }
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
