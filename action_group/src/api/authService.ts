import type { User } from '@/types'
import { delay, uid } from './storage'
import { usersService } from './usersService'

const SESSION_KEY = 'prz:v1:session'

interface StoredSession {
  userId: string
  token: string
}

export const authService = {
  async login(login: string, password: string): Promise<User> {
    await delay(280)
    const user = await usersService.findByLogin(login)
    if (!user || user.password !== password) {
      throw new Error('Неверный логин или пароль')
    }
    const session: StoredSession = { userId: user.id, token: uid('token') }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return user
  },

  async logout(): Promise<void> {
    await delay(80)
    localStorage.removeItem(SESSION_KEY)
  },

  async restoreSession(): Promise<User | null> {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      const session = JSON.parse(raw) as StoredSession
      return await usersService.get(session.userId)
    } catch {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
  },
}
