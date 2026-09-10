import type { SkillDirection } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedDirections } from './seed'

let items: SkillDirection[] = loadCollection('directions', seedDirections)

function persist() {
  saveCollection('directions', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export const directionsService = {
  async list(): Promise<SkillDirection[]> {
    await delay()
    return clone(items)
  },

  async create(name: string): Promise<SkillDirection> {
    await delay()
    const direction: SkillDirection = { id: uid('dir'), name }
    items.push(direction)
    persist()
    return clone(direction)
  },

  async rename(id: string, name: string): Promise<SkillDirection> {
    await delay()
    const idx = items.findIndex((d) => d.id === id)
    const current = items[idx]
    if (idx === -1 || !current) throw new Error('Направление не найдено')
    const updated = { ...current, name }
    items[idx] = updated
    persist()
    return clone(updated)
  },

  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((d) => d.id !== id)
    persist()
  },
}
