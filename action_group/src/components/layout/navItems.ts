export interface NavItem {
  to: string
  label: string
  icon: string
  adminOnly?: boolean
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Главная', icon: '🏠' },
  { to: '/employees', label: 'Сотрудники', icon: '👥' },
  { to: '/analytics', label: 'Аналитика', icon: '📊' },
]

export const adminNav: NavItem[] = [
  { to: '/departments', label: 'Структура', icon: '🗂️', adminOnly: true },
  { to: '/skills', label: 'Навыки', icon: '🎯', adminOnly: true },
  { to: '/users', label: 'Пользователи', icon: '🧑‍💼', adminOnly: true },
]
