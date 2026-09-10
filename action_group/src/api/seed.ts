import type { Department, Meeting, PlanItem, Skill, SkillDirection, User } from '@/types'

// Deterministic demo dataset: a small company tree, three sub-teams,
// a skill catalog per direction, annual plans and a couple of meeting
// protocols so every screen (list, tree, plan, meetings, analytics) has
// something meaningful to show on first run.

function isoDaysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const seedDirections = (): SkillDirection[] => [
  { id: 'dir-back', name: 'Backend' },
  { id: 'dir-front', name: 'Frontend' },
  { id: 'dir-qa', name: 'QA' },
]

export const seedDepartments = (): Department[] => [
  { id: 'dept-root', name: 'Компания', parentId: null, managerId: 'user-ceo' },
  { id: 'dept-dev', name: 'Разработка', parentId: 'dept-root', managerId: 'user-cto' },
  { id: 'dept-back', name: 'Backend', parentId: 'dept-dev', managerId: 'user-back-lead' },
  { id: 'dept-front', name: 'Frontend', parentId: 'dept-dev', managerId: 'user-front-lead' },
  { id: 'dept-qa', name: 'QA', parentId: 'dept-dev', managerId: 'user-qa-lead' },
]

export const seedUsers = (): User[] => [
  {
    id: 'user-admin',
    fullName: 'Администратор Системы',
    login: 'admin',
    password: 'admin',
    directionId: 'dir-back',
    departmentId: 'dept-root',
    isAdmin: true,
    avatarColor: '#6366f1',
    createdAt: isoDaysFromNow(-400),
  },
  {
    id: 'user-ceo',
    fullName: 'Иванов Иван',
    login: 'ceo',
    password: 'ceo123',
    directionId: 'dir-back',
    departmentId: 'dept-root',
    isAdmin: false,
    avatarColor: '#0ea5e9',
    createdAt: isoDaysFromNow(-400),
  },
  {
    id: 'user-cto',
    fullName: 'Смирнова Ольга',
    login: 'cto',
    password: 'cto123',
    directionId: 'dir-back',
    departmentId: 'dept-root',
    isAdmin: false,
    avatarColor: '#0ea5e9',
    createdAt: isoDaysFromNow(-380),
  },
  {
    id: 'user-back-lead',
    fullName: 'Кузнецов Дмитрий',
    login: 'back.lead',
    password: 'lead123',
    directionId: 'dir-back',
    departmentId: 'dept-dev',
    isAdmin: false,
    avatarColor: '#22c55e',
    createdAt: isoDaysFromNow(-360),
  },
  {
    id: 'user-front-lead',
    fullName: 'Орлова Анна',
    login: 'front.lead',
    password: 'lead123',
    directionId: 'dir-front',
    departmentId: 'dept-dev',
    isAdmin: false,
    avatarColor: '#f59e0b',
    createdAt: isoDaysFromNow(-360),
  },
  {
    id: 'user-qa-lead',
    fullName: 'Петров Сергей',
    login: 'qa.lead',
    password: 'lead123',
    directionId: 'dir-qa',
    departmentId: 'dept-dev',
    isAdmin: false,
    avatarColor: '#ec4899',
    createdAt: isoDaysFromNow(-360),
  },
  {
    id: 'user-back-1',
    fullName: 'Волков Артём',
    login: 'a.volkov',
    password: 'pass123',
    directionId: 'dir-back',
    departmentId: 'dept-back',
    isAdmin: false,
    avatarColor: '#22c55e',
    createdAt: isoDaysFromNow(-300),
  },
  {
    id: 'user-back-2',
    fullName: 'Соколова Мария',
    login: 'm.sokolova',
    password: 'pass123',
    directionId: 'dir-back',
    departmentId: 'dept-back',
    isAdmin: false,
    avatarColor: '#22c55e',
    createdAt: isoDaysFromNow(-280),
  },
  {
    id: 'user-back-3',
    fullName: 'Морозов Егор',
    login: 'e.morozov',
    password: 'pass123',
    directionId: 'dir-back',
    departmentId: 'dept-back',
    isAdmin: false,
    avatarColor: '#22c55e',
    createdAt: isoDaysFromNow(-120),
  },
  {
    id: 'user-front-1',
    fullName: 'Новикова Дарья',
    login: 'd.novikova',
    password: 'pass123',
    directionId: 'dir-front',
    departmentId: 'dept-front',
    isAdmin: false,
    avatarColor: '#f59e0b',
    createdAt: isoDaysFromNow(-300),
  },
  {
    id: 'user-front-2',
    fullName: 'Лебедев Игорь',
    login: 'i.lebedev',
    password: 'pass123',
    directionId: 'dir-front',
    departmentId: 'dept-front',
    isAdmin: false,
    avatarColor: '#f59e0b',
    createdAt: isoDaysFromNow(-200),
  },
  {
    id: 'user-front-3',
    fullName: 'Попова Виктория',
    login: 'v.popova',
    password: 'pass123',
    directionId: 'dir-front',
    departmentId: 'dept-front',
    isAdmin: false,
    avatarColor: '#f59e0b',
    createdAt: isoDaysFromNow(-90),
  },
  {
    id: 'user-qa-1',
    fullName: 'Фёдоров Никита',
    login: 'n.fedorov',
    password: 'pass123',
    directionId: 'dir-qa',
    departmentId: 'dept-qa',
    isAdmin: false,
    avatarColor: '#ec4899',
    createdAt: isoDaysFromNow(-260),
  },
  {
    id: 'user-qa-2',
    fullName: 'Козлова Елена',
    login: 'e.kozlova',
    password: 'pass123',
    directionId: 'dir-qa',
    departmentId: 'dept-qa',
    isAdmin: false,
    avatarColor: '#ec4899',
    createdAt: isoDaysFromNow(-150),
  },
]

export const seedSkills = (): Skill[] => [
  { id: 'skill-back-1', name: 'REST API design', directionId: 'dir-back' },
  { id: 'skill-back-2', name: 'Базы данных (SQL)', directionId: 'dir-back' },
  { id: 'skill-back-3', name: 'Асинхронное программирование', directionId: 'dir-back' },
  { id: 'skill-back-4', name: 'Микросервисная архитектура', directionId: 'dir-back' },
  { id: 'skill-back-5', name: 'Docker / Kubernetes', directionId: 'dir-back' },
  { id: 'skill-back-6', name: 'Тестирование (unit/integration)', directionId: 'dir-back' },
  { id: 'skill-front-1', name: 'Vue 3 / Composition API', directionId: 'dir-front' },
  { id: 'skill-front-2', name: 'TypeScript', directionId: 'dir-front' },
  { id: 'skill-front-3', name: 'State management (Pinia)', directionId: 'dir-front' },
  { id: 'skill-front-4', name: 'Веб-производительность', directionId: 'dir-front' },
  { id: 'skill-front-5', name: 'Доступность (a11y)', directionId: 'dir-front' },
  { id: 'skill-front-6', name: 'Дизайн-системы', directionId: 'dir-front' },
  { id: 'skill-qa-1', name: 'Тест-дизайн', directionId: 'dir-qa' },
  { id: 'skill-qa-2', name: 'Автотесты (E2E)', directionId: 'dir-qa' },
  { id: 'skill-qa-3', name: 'API-тестирование', directionId: 'dir-qa' },
  { id: 'skill-qa-4', name: 'Нагрузочное тестирование', directionId: 'dir-qa' },
  { id: 'skill-qa-5', name: 'Баг-трекинг и репортинг', directionId: 'dir-qa' },
  { id: 'skill-qa-6', name: 'CI/CD для тестов', directionId: 'dir-qa' },
]

export const seedPlanItems = (): PlanItem[] => [
  // Артём Волков (BACK)
  { id: 'plan-1', userId: 'user-back-1', skillId: 'skill-back-1', plannedDate: isoDaysFromNow(-60), status: 'confirmed', confirmedDate: isoDaysFromNow(-58), confirmedInMeetingId: 'meeting-1' },
  { id: 'plan-2', userId: 'user-back-1', skillId: 'skill-back-2', plannedDate: isoDaysFromNow(-20), status: 'problem', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-3', userId: 'user-back-1', skillId: 'skill-back-3', plannedDate: isoDaysFromNow(30), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-4', userId: 'user-back-1', skillId: 'skill-back-5', plannedDate: isoDaysFromNow(90), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Мария Соколова (BACK)
  { id: 'plan-5', userId: 'user-back-2', skillId: 'skill-back-1', plannedDate: isoDaysFromNow(-90), status: 'confirmed', confirmedDate: isoDaysFromNow(-91), confirmedInMeetingId: 'meeting-2' },
  { id: 'plan-6', userId: 'user-back-2', skillId: 'skill-back-4', plannedDate: isoDaysFromNow(-91), status: 'confirmed', confirmedDate: isoDaysFromNow(-91), confirmedInMeetingId: 'meeting-2' },
  { id: 'plan-7', userId: 'user-back-2', skillId: 'skill-back-6', plannedDate: isoDaysFromNow(15), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Егор Морозов (BACK, new hire)
  { id: 'plan-8', userId: 'user-back-3', skillId: 'skill-back-1', plannedDate: isoDaysFromNow(20), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-9', userId: 'user-back-3', skillId: 'skill-back-2', plannedDate: isoDaysFromNow(45), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Дарья Новикова (FRONT)
  { id: 'plan-10', userId: 'user-front-1', skillId: 'skill-front-1', plannedDate: isoDaysFromNow(-70), status: 'confirmed', confirmedDate: isoDaysFromNow(-72), confirmedInMeetingId: 'meeting-3' },
  { id: 'plan-11', userId: 'user-front-1', skillId: 'skill-front-2', plannedDate: isoDaysFromNow(-72), status: 'confirmed', confirmedDate: isoDaysFromNow(-72), confirmedInMeetingId: 'meeting-3' },
  { id: 'plan-12', userId: 'user-front-1', skillId: 'skill-front-4', plannedDate: isoDaysFromNow(-10), status: 'problem', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-13', userId: 'user-front-1', skillId: 'skill-front-5', plannedDate: isoDaysFromNow(60), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Игорь Лебедев (FRONT)
  { id: 'plan-14', userId: 'user-front-2', skillId: 'skill-front-1', plannedDate: isoDaysFromNow(-40), status: 'confirmed', confirmedDate: isoDaysFromNow(-41), confirmedInMeetingId: 'meeting-4' },
  { id: 'plan-15', userId: 'user-front-2', skillId: 'skill-front-3', plannedDate: isoDaysFromNow(25), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-16', userId: 'user-front-2', skillId: 'skill-front-6', plannedDate: isoDaysFromNow(75), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Виктория Попова (FRONT, new hire)
  { id: 'plan-17', userId: 'user-front-3', skillId: 'skill-front-2', plannedDate: isoDaysFromNow(15), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Никита Фёдоров (QA)
  { id: 'plan-18', userId: 'user-qa-1', skillId: 'skill-qa-1', plannedDate: isoDaysFromNow(-55), status: 'confirmed', confirmedDate: isoDaysFromNow(-56), confirmedInMeetingId: 'meeting-5' },
  { id: 'plan-19', userId: 'user-qa-1', skillId: 'skill-qa-2', plannedDate: isoDaysFromNow(-56), status: 'confirmed', confirmedDate: isoDaysFromNow(-56), confirmedInMeetingId: 'meeting-5' },
  { id: 'plan-20', userId: 'user-qa-1', skillId: 'skill-qa-4', plannedDate: isoDaysFromNow(-5), status: 'problem', confirmedDate: null, confirmedInMeetingId: null },
  { id: 'plan-21', userId: 'user-qa-1', skillId: 'skill-qa-6', plannedDate: isoDaysFromNow(40), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
  // Елена Козлова (QA)
  { id: 'plan-22', userId: 'user-qa-2', skillId: 'skill-qa-1', plannedDate: isoDaysFromNow(-30), status: 'confirmed', confirmedDate: isoDaysFromNow(-33), confirmedInMeetingId: 'meeting-6' },
  { id: 'plan-23', userId: 'user-qa-2', skillId: 'skill-qa-3', plannedDate: isoDaysFromNow(35), status: 'planned', confirmedDate: null, confirmedInMeetingId: null },
]

export const seedMeetings = (): Meeting[] => [
  {
    id: 'meeting-1',
    employeeId: 'user-back-1',
    conductedById: 'user-back-lead',
    date: isoDaysFromNow(-58),
    summaryMarkdown:
      '### Итоги встречи\n\nАртём хорошо разобрался с проектированием REST API, разобрали best practices версионирования.\n\n**Дальше:** сфокусироваться на SQL — есть пробелы в оконных функциях.',
    attachments: [{ id: 'att-1', type: 'link', name: 'Заметки в Confluence', url: 'https://example.com/notes/1' }],
    skillMarks: [{ skillId: 'skill-back-1', confirmed: true, comment: 'Уверенно применяет на практике' }],
    problems: [],
    createdAt: isoDaysFromNow(-58),
  },
  {
    id: 'meeting-2',
    employeeId: 'user-back-2',
    conductedById: 'user-back-lead',
    date: isoDaysFromNow(-91),
    summaryMarkdown:
      '### Итоги встречи\n\nМария показала отличное понимание микросервисной архитектуры на примере текущего проекта.',
    attachments: [],
    skillMarks: [
      { skillId: 'skill-back-1', confirmed: true, comment: '' },
      { skillId: 'skill-back-4', confirmed: true, comment: 'Разложила по полочкам паттерны saga/outbox' },
    ],
    problems: [],
    createdAt: isoDaysFromNow(-91),
  },
  {
    id: 'meeting-3',
    employeeId: 'user-front-1',
    conductedById: 'user-front-lead',
    date: isoDaysFromNow(-72),
    summaryMarkdown: '### Итоги встречи\n\nДарья закрыла Vue 3 и TypeScript, готова к более сложным задачам.',
    attachments: [{ id: 'att-2', type: 'file', name: 'code-review-screenshot.png', url: '#' }],
    skillMarks: [
      { skillId: 'skill-front-1', confirmed: true, comment: '' },
      { skillId: 'skill-front-2', confirmed: true, comment: '' },
    ],
    problems: [],
    createdAt: isoDaysFromNow(-72),
  },
  {
    id: 'meeting-4',
    employeeId: 'user-front-2',
    conductedById: 'user-front-lead',
    date: isoDaysFromNow(-41),
    summaryMarkdown: '### Итоги встречи\n\nИгорь подтвердил Vue 3, но пока не готов к менторству джунов — рано.',
    attachments: [],
    skillMarks: [{ skillId: 'skill-front-1', confirmed: true, comment: '' }],
    problems: [
      {
        id: 'problem-1',
        scope: 'employee',
        skillId: null,
        comment: 'Нужно подтянуть soft skills — сложно объясняет решения на код-ревью',
        resolved: false,
      },
    ],
    createdAt: isoDaysFromNow(-41),
  },
  {
    id: 'meeting-5',
    employeeId: 'user-qa-1',
    conductedById: 'user-qa-lead',
    date: isoDaysFromNow(-56),
    summaryMarkdown: '### Итоги встречи\n\nНикита закрыл тест-дизайн и автотесты, хорошая динамика.',
    attachments: [],
    skillMarks: [
      { skillId: 'skill-qa-1', confirmed: true, comment: '' },
      { skillId: 'skill-qa-2', confirmed: true, comment: '' },
    ],
    problems: [],
    createdAt: isoDaysFromNow(-56),
  },
  {
    id: 'meeting-6',
    employeeId: 'user-qa-2',
    conductedById: 'user-qa-lead',
    date: isoDaysFromNow(-33),
    summaryMarkdown: '### Итоги встречи\n\nЕлена подтвердила тест-дизайн, план по API-тестированию сдвинут.',
    attachments: [],
    skillMarks: [{ skillId: 'skill-qa-1', confirmed: true, comment: '' }],
    problems: [
      {
        id: 'problem-2',
        scope: 'skill',
        skillId: 'skill-qa-3',
        comment: 'Не хватает практики с Postman/newman в CI',
        resolved: false,
      },
    ],
    createdAt: isoDaysFromNow(-33),
  },
]
