import type { Skill } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedSkills } from './seed'

let items: Skill[] = loadCollection('skills', seedSkills)

function persist() {
  saveCollection('skills', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export const skillsService = {
  async list(): Promise<Skill[]> {
    await delay()
    return clone(items)
  },

  async create(data: { name: string; directionId: string }): Promise<Skill> {
    await delay()
    const skill: Skill = { id: uid('skill'), ...data }
    items.push(skill)
    persist()
    return clone(skill)
  },

  async update(id: string, patch: Partial<Pick<Skill, 'name' | 'directionId'>>): Promise<Skill> {
    await delay()
    const idx = items.findIndex((s) => s.id === id)
    const current = items[idx]
    if (idx === -1 || !current) throw new Error('Навык не найден')
    const updated = { ...current, ...patch }
    items[idx] = updated
    persist()
    return clone(updated)
  },

  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((s) => s.id !== id)
    persist()
  },
}
