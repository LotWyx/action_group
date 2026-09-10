<script setup lang="ts">
import { computed } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { useSkillsStore } from '@/stores/skills'
import type { User } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DonutProgress from '@/components/charts/DonutProgress.vue'
import TrendLine from '@/components/charts/TrendLine.vue'
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

const trendPoints = computed(() => {
  const list = meetings.forUser(props.employee.id).slice().sort((a, b) => a.date.localeCompare(b.date))
  let cumulative = 0
  return list.map((m, i) => {
    cumulative += m.skillMarks.filter((s) => s.confirmed).length
    return { label: `${i + 1}`, value: cumulative }
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
      <p class="text-sm text-muted" style="margin-bottom: 10px">Динамика зачтённых навыков (по встречам)</p>
      <TrendLine v-if="trendPoints.length" :points="trendPoints" />
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
