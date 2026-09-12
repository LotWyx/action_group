import type { Component } from 'vue'
import { BarChart3, Building2, Home, Target, UserCog, Users } from '@lucide/vue'

export interface NavItem {
  to: string
  label: string
  icon: Component
  adminOnly?: boolean
  /** Only meaningful for someone who manages at least one other employee (or is admin) — a lone contributor has nothing to see there. */
  requiresSubordinates?: boolean
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Главная', icon: Home },
  { to: '/employees', label: 'Сотрудники', icon: Users, requiresSubordinates: true },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3, requiresSubordinates: true },
]

export const adminNav: NavItem[] = [
  { to: '/departments', label: 'Структура', icon: Building2, adminOnly: true },
  { to: '/skills', label: 'Навыки', icon: Target, adminOnly: true },
  { to: '/users', label: 'Пользователи', icon: UserCog, adminOnly: true },
]
