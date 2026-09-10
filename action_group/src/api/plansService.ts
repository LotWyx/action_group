import type { PlanItem, PlanItemStatus } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedPlanItems } from './seed'

let items: PlanItem[] = loadCollection('plan_items', seedPlanItems)

function persist() {
  saveCollection('plan_items', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

/** Planned items whose date has passed and are still not confirmed become "problem". */
export function deriveStatus(item: Pick<PlanItem, 'status' | 'plannedDate'>): PlanItemStatus {
  if (item.status === 'confirmed') return 'confirmed'
  const isOverdue = new Date(item.plannedDate).getTime() < Date.now()
  return isOverdue ? 'problem' : 'planned'
}

export const plansService = {
  async listAll(): Promise<PlanItem[]> {
    await delay()
    return clone(items)
  },

  async listForUser(userId: string): Promise<PlanItem[]> {
    await delay()
    return clone(items.filter((p) => p.userId === userId))
  },

  async addSkill(data: { userId: string; skillId: string; plannedDate: string }): Promise<PlanItem> {
    await delay()
    if (items.some((p) => p.userId === data.userId && p.skillId === data.skillId)) {
      throw new Error('Этот навык уже есть в плане сотрудника')
    }
    const item: PlanItem = {
      id: uid('plan'),
      userId: data.userId,
      skillId: data.skillId,
      plannedDate: data.plannedDate,
      status: 'planned',
      confirmedDate: null,
      confirmedInMeetingId: null,
    }
    items.push(item)
    persist()
    return clone(item)
  },

  async updatePlannedDate(id: string, plannedDate: string): Promise<PlanItem> {
    await delay()
    const idx = items.findIndex((p) => p.id === id)
    const current = items[idx]
    if (idx === -1 || !current) throw new Error('Пункт плана не найден')
    const updated = { ...current, plannedDate }
    items[idx] = updated
    persist()
    return clone(updated)
  },

  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((p) => p.id !== id)
    persist()
  },

  /** Marks a plan item confirmed as a side effect of a meeting protocol. Internal use by meetingsService. */
  _confirmFromMeeting(userId: string, skillId: string, meetingId: string, date: string) {
    const idx = items.findIndex((p) => p.userId === userId && p.skillId === skillId)
    if (idx === -1) {
      items.push({
        id: uid('plan'),
        userId,
        skillId,
        plannedDate: date,
        status: 'confirmed',
        confirmedDate: date,
        confirmedInMeetingId: meetingId,
      })
    } else {
      const current = items[idx]
      if (current) {
        items[idx] = {
          ...current,
          status: 'confirmed',
          confirmedDate: date,
          confirmedInMeetingId: meetingId,
        }
      }
    }
    persist()
  },
}
