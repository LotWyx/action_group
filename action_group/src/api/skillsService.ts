import type { Skill } from '@/types'
import { http } from './http'

export const skillsService = {
  async list(): Promise<Skill[]> {
    const { data } = await http.get<Skill[]>('/skills')
    return data
  },

  async create(data: { name: string; directionId: string; description?: string | null }): Promise<Skill> {
    const { data: skill } = await http.post<Skill>('/skills', data)
    return skill
  },

  async update(id: string, patch: Partial<Pick<Skill, 'name' | 'directionId' | 'description'>>): Promise<Skill> {
    const { data } = await http.patch<Skill>(`/skills/${id}`, patch)
    return data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/skills/${id}`)
  },
}
