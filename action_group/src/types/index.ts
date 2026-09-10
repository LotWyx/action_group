// Domain types for the Performance Review system.
// Kept backend-agnostic on purpose: the mock API layer (src/api) implements
// these same shapes today and can be swapped for real FastAPI responses later
// without touching stores/components.

/**
 * Directions (BACK/FRONT/QA and whatever an admin adds later) are data, not a
 * hardcoded enum: the case requires the skill catalog's directions themselves
 * to be editable (add/rename/remove), so they live in the same mock/service
 * layer as everything else.
 */
export interface SkillDirection {
  id: string
  name: string
}

export interface Department {
  id: string
  name: string
  parentId: string | null
  managerId: string | null
}

export interface User {
  id: string
  fullName: string
  login: string
  /** Demo-only plaintext password. A real backend must never expose this. */
  password: string
  directionId: string
  departmentId: string | null
  isAdmin: boolean
  avatarColor: string
  createdAt: string
}

export interface Skill {
  id: string
  name: string
  directionId: string
}

export type PlanItemStatus = 'planned' | 'confirmed' | 'problem'

export interface PlanItem {
  id: string
  userId: string
  skillId: string
  plannedDate: string // ISO date
  status: PlanItemStatus
  confirmedDate: string | null
  confirmedInMeetingId: string | null
}

export type AttachmentType = 'file' | 'link'

export interface Attachment {
  id: string
  type: AttachmentType
  name: string
  url: string
}

export interface SkillMark {
  skillId: string
  /** true = skill confirmed during this meeting, false = discussed only */
  confirmed: boolean
  comment: string
}

export interface ProblemFlag {
  id: string
  /** scope 'skill' targets a specific skill, 'employee' is a general concern */
  scope: 'skill' | 'employee'
  skillId: string | null
  comment: string
  resolved: boolean
}

export interface Meeting {
  id: string
  employeeId: string
  conductedById: string
  date: string // ISO date
  summaryMarkdown: string
  attachments: Attachment[]
  skillMarks: SkillMark[]
  problems: ProblemFlag[]
  createdAt: string
}

export interface AuthSession {
  userId: string
  token: string
}
