import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PlanItem } from '@/types'
import { plansService, deriveStatus } from '@/api/plansService'

export const usePlansStore = defineStore('plans', () => {
  const items = ref<PlanItem[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      const raw = await plansService.listAll()
      items.value = raw.map((p) => ({ ...p, status: deriveStatus(p) }))
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  function forUser(userId: string): PlanItem[] {
    return items.value.filter((p) => p.userId === userId)
  }

  async function addSkill(data: { userId: string; skillId: string; plannedDate: string }) {
    const item = await plansService.addSkill(data)
    items.value.push(item)
    return item
  }

  async function updatePlannedDate(id: string, plannedDate: string) {
    const item = await plansService.updatePlannedDate(id, plannedDate)
    const idx = items.value.findIndex((p) => p.id === id)
    if (idx !== -1) items.value[idx] = { ...item, status: deriveStatus(item) }
    return item
  }

  async function remove(id: string) {
    await plansService.remove(id)
    items.value = items.value.filter((p) => p.id !== id)
  }

  /** Re-derives overdue "problem" status without a full refetch. */
  function refreshStatuses() {
    items.value = items.value.map((p) => ({ ...p, status: deriveStatus(p) }))
  }

  return { items, loaded, loading, fetchAll, forUser, addSkill, updatePlannedDate, remove, refreshStatuses }
})
