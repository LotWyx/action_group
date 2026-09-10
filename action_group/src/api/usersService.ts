import type { User } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedUsers } from './seed'

let items: User[] = loadCollection('users', seedUsers)

function persist() {
  saveCollection('users', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

const AVATAR_PALETTE = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']

export interface CreateUserInput {
  fullName: string
  login: string
  password: string
  directionId: string
  departmentId: string | null
  isAdmin: boolean
}

export const usersService = {
  async list(): Promise<User[]> {
    await delay()
    return clone(items)
  },

  async get(id: string): Promise<User | null> {
    await delay()
    const found = items.find((u) => u.id === id)
    return found ? clone(found) : null
  },

  async findByLogin(login: string): Promise<User | null> {
    await delay()
    const found = items.find((u) => u.login.toLowerCase() === login.toLowerCase())
    return found ? clone(found) : null
  },

  async create(data: CreateUserInput): Promise<User> {
    await delay()
    if (items.some((u) => u.login.toLowerCase() === data.login.toLowerCase())) {
      throw new Error('Логин уже занят')
    }
    const user: User = {
      id: uid('user'),
      ...data,
      avatarColor: AVATAR_PALETTE[items.length % AVATAR_PALETTE.length] ?? '#6366f1',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    items.push(user)
    persist()
    return clone(user)
  },

  async update(
    id: string,
    patch: Partial<Pick<User, 'fullName' | 'login' | 'password' | 'directionId' | 'departmentId' | 'isAdmin'>>,
  ): Promise<User> {
    await delay()
    const idx = items.findIndex((u) => u.id === id)
    const current = items[idx]
    if (idx === -1 || !current) throw new Error('Пользователь не найден')
    if (patch.login && items.some((u) => u.id !== id && u.login.toLowerCase() === patch.login!.toLowerCase())) {
      throw new Error('Логин уже занят')
    }
    const updated = { ...current, ...patch }
    items[idx] = updated
    persist()
    return clone(updated)
  },

  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((u) => u.id !== id)
    persist()
  },
}
