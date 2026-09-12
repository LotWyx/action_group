<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { useScheduledMeetingsStore } from '@/stores/scheduledMeetings'
import { useSkillsStore } from '@/stores/skills'
import type { User } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import AchievementBadges from '@/components/employees/AchievementBadges.vue'
import { Calendar, CheckCircle2 } from '@lucide/vue'

const props = defineProps<{ employee: User }>()

const plans = usePlansStore()
const meetings = useMeetingsStore()
const scheduledMeetings = useScheduledMeetingsStore()
const skills = useSkillsStore()

onMounted(() => scheduledMeetings.fetchAll())

const todayIso = new Date().toISOString().slice(0, 10)

const planItems = computed(() => plans.forUser(props.employee.id))
const confirmedCount = computed(() => planItems.value.filter((p) => p.status === 'confirmed').length)
const overdueItems = computed(() => planItems.value.filter((p) => p.status === 'problem'))
const plannedItems = computed(() => planItems.value.filter((p) => p.status === 'planned'))

const nextMeeting = computed(() => scheduledMeetings.forUser(props.employee.id).find((m) => m.scheduledDate >= todayIso) ?? null)

const openProblems = computed(() =>
  meetings
    .forUser(props.employee.id)
    .flatMap((m) => m.problems.map((p) => ({ ...p, meetingDate: m.date })))
    .filter((p) => !p.resolved)
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)),
)
</script>

<template>
  <div class="stack gap-lg">
    <div class="overview-grid">
      <BaseCard>
        <p class="text-sm text-muted">План развития</p>
        <p class="overview-stat">{{ planItems.length }}</p>
        <p class="text-sm text-muted" style="margin-bottom: 10px">навыков в плане</p>
        <div class="row gap-sm wrap">
          <BaseBadge variant="success">{{ confirmedCount }} подтверждено</BaseBadge>
          <BaseBadge v-if="plannedItems.length" variant="warning">{{ plannedItems.length }} в работе</BaseBadge>
          <BaseBadge v-if="overdueItems.length" variant="danger">{{ overdueItems.length }} просрочено</BaseBadge>
        </div>
      </BaseCard>

      <BaseCard>
        <p class="text-sm text-muted" style="margin-bottom: 10px">Ближайшая PR-встреча</p>
        <template v-if="nextMeeting">
          <div class="row gap-sm" style="align-items: center">
            <Calendar :size="18" style="color: var(--color-primary)" />
            <p style="font-weight: 700; font-size: 16px">{{ nextMeeting.scheduledDate }}</p>
          </div>
          <p v-if="nextMeeting.note" class="text-sm text-muted" style="margin-top: 6px">{{ nextMeeting.note }}</p>
        </template>
        <p v-else class="text-sm text-faint">Не запланирована</p>
      </BaseCard>
    </div>

    <BaseCard v-if="overdueItems.length">
      <p class="text-sm text-muted" style="margin-bottom: 10px">Отставание от плановых дат</p>
      <ul class="overview-list">
        <li v-for="item in overdueItems" :key="item.id">
          <span>{{ skills.name(item.skillId) }}</span>
          <span class="text-sm text-danger">план: {{ item.plannedDate }}</span>
        </li>
      </ul>
    </BaseCard>

    <BaseCard v-if="openProblems.length">
      <p class="text-sm text-muted" style="margin-bottom: 10px">Открытые проблемы</p>
      <ul class="overview-list">
        <li v-for="p in openProblems" :key="p.id">
          <span>
            <BaseBadge variant="danger">{{ p.scope === 'skill' ? skills.name(p.skillId ?? '') : 'Общее' }}</BaseBadge>
            {{ p.comment }}
          </span>
          <span class="text-sm text-faint">{{ p.meetingDate }}</span>
        </li>
      </ul>
    </BaseCard>
    <BaseCard v-else>
      <div class="row gap-sm" style="align-items: center; color: var(--color-success)">
        <CheckCircle2 :size="18" />
        <p class="text-sm" style="font-weight: 600">Открытых проблем нет</p>
      </div>
    </BaseCard>

    <AchievementBadges :employee="employee" />
  </div>
</template>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.overview-stat {
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0 0;
}

.overview-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
}

.overview-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}
.overview-list li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.text-danger {
  color: var(--color-danger);
}

@media (max-width: 560px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
