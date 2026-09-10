<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useDepartmentsStore } from '@/stores/departments'
import { usePlansStore } from '@/stores/plans'
import { useMeetingsStore } from '@/stores/meetings'
import { usePermissions } from '@/composables/usePermissions'
import BaseCard from '@/components/ui/BaseCard.vue'
import BarRow from '@/components/charts/BarRow.vue'
import DonutProgress from '@/components/charts/DonutProgress.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const users = useUsersStore()
const departments = useDepartmentsStore()
const plans = usePlansStore()
const meetings = useMeetingsStore()
const perm = usePermissions()
const router = useRouter()

onMounted(async () => {
  await Promise.all([users.fetchAll(), departments.fetchAll(), plans.fetchAll(), meetings.fetchAll()])
})

const scopeDeptIds = computed(() =>
  perm.isAdmin.value ? new Set(departments.items.map((d) => d.id)) : perm.managedDepartmentIds.value,
)

function usersInSubtree(deptId: string): string[] {
  const ids = new Set([deptId, ...departments.descendantsOf(deptId)])
  return users.items.filter((u) => u.departmentId && ids.has(u.departmentId)).map((u) => u.id)
}

interface DeptStat {
  id: string
  label: string
  people: number
  completion: number
  openProblems: number
  planTotal: number
}

const deptStats = computed<DeptStat[]>(() => {
  return [...scopeDeptIds.value]
    .map((deptId) => {
      const memberIds = new Set(usersInSubtree(deptId))
      const relevantPlans = plans.items.filter((p) => memberIds.has(p.userId))
      const confirmed = relevantPlans.filter((p) => p.status === 'confirmed').length
      const openProblems = meetings.items
        .filter((m) => memberIds.has(m.employeeId))
        .flatMap((m) => m.problems)
        .filter((p) => !p.resolved).length
      return {
        id: deptId,
        label: departments.pathLabel(deptId),
        people: memberIds.size,
        completion: relevantPlans.length ? Math.round((confirmed / relevantPlans.length) * 100) : 0,
        openProblems,
        planTotal: relevantPlans.length,
      }
    })
    .filter((s) => s.people > 0)
    .sort((a, b) => a.label.localeCompare(b.label))
})

const overall = computed(() => {
  const scopeIds = perm.isAdmin.value ? new Set(users.items.map((u) => u.id)) : perm.visibleEmployeeIds.value
  const relevantPlans = plans.items.filter((p) => scopeIds.has(p.userId))
  const confirmed = relevantPlans.filter((p) => p.status === 'confirmed').length
  const openProblems = meetings.items
    .filter((m) => scopeIds.has(m.employeeId))
    .flatMap((m) => m.problems)
    .filter((p) => !p.resolved).length
  return {
    people: scopeIds.size,
    completion: relevantPlans.length ? Math.round((confirmed / relevantPlans.length) * 100) : 0,
    openProblems,
  }
})

function openDept(deptId: string) {
  router.push({ path: '/employees', query: { dept: deptId } })
}
</script>

<template>
  <div class="stack gap-lg">
    <div>
      <h1 class="text-lg">Аналитика</h1>
      <p class="text-sm text-muted">Прогресс обучения и открытые проблемы в разрезе подразделений</p>
    </div>

    <div class="grid" style="grid-template-columns: auto 1fr; align-items: center; gap: 24px">
      <BaseCard class="row" style="justify-content: center">
        <DonutProgress :value="overall.completion" />
      </BaseCard>
      <BaseCard>
        <p class="text-sm text-muted">Сотрудников в зоне видимости</p>
        <p class="stat">{{ overall.people }}</p>
        <p class="text-sm" :class="overall.openProblems ? 'text-danger' : 'text-muted'">
          {{ overall.openProblems }} открытых проблем
        </p>
      </BaseCard>
    </div>

    <EmptyState v-if="!deptStats.length" title="Нет данных для отображения" description="Аналитика появится, когда в подразделениях будут сотрудники" />

    <BaseCard v-else>
      <p style="font-weight: 700; margin-bottom: 16px">По подразделениям</p>
      <div class="stack gap-md">
        <button v-for="d in deptStats" :key="d.id" type="button" class="dept-row" @click="openDept(d.id)">
          <BarRow
            :label="d.label"
            :value="d.completion"
            :sub="`${d.people} сотр. · ${d.planTotal} навыков в планах`"
            :color="d.completion >= 70 ? 'var(--color-success)' : d.completion >= 40 ? 'var(--color-warning)' : 'var(--color-danger)'"
          />
          <span v-if="d.openProblems" class="dept-row__problems">{{ d.openProblems }} проблем</span>
        </button>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.stat {
  font-size: 26px;
  font-weight: 800;
  margin: 4px 0;
}
.text-danger {
  color: var(--color-danger);
}

.dept-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  padding: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  width: 100%;
}
.dept-row:hover {
  background: var(--color-surface-alt);
}
.dept-row > :first-child {
  flex: 1;
}

.dept-row__problems {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  padding: 3px 10px;
  border-radius: 999px;
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
