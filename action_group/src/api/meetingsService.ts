import type { Attachment, Meeting, ProblemFlag, SkillMark } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedMeetings } from './seed'
import { plansService } from './plansService'

let items: Meeting[] = loadCollection('meetings', seedMeetings)

function persist() {
  saveCollection('meetings', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export interface MeetingInput {
  employeeId: string
  conductedById: string
  date: string
  summaryMarkdown: string
  attachments: Omit<Attachment, 'id'>[]
  skillMarks: SkillMark[]
  problems: Omit<ProblemFlag, 'id'>[]
}

export const meetingsService = {
  async list(): Promise<Meeting[]> {
    await delay()
    return clone(items)
  },

  async listForUser(userId: string): Promise<Meeting[]> {
    await delay()
    return clone(
      items.filter((m) => m.employeeId === userId).sort((a, b) => b.date.localeCompare(a.date)),
    )
  },

  async get(id: string): Promise<Meeting | null> {
    await delay()
    const found = items.find((m) => m.id === id)
    return found ? clone(found) : null
  },

  async create(data: MeetingInput): Promise<Meeting> {
    await delay()
    const meeting: Meeting = {
      id: uid('meeting'),
      employeeId: data.employeeId,
      conductedById: data.conductedById,
      date: data.date,
      summaryMarkdown: data.summaryMarkdown,
      attachments: data.attachments.map((a) => ({ id: uid('att'), ...a })),
      skillMarks: data.skillMarks,
      problems: data.problems.map((p) => ({ id: uid('problem'), ...p })),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    items.push(meeting)
    persist()

    for (const mark of meeting.skillMarks) {
      if (mark.confirmed) {
        plansService._confirmFromMeeting(meeting.employeeId, mark.skillId, meeting.id, meeting.date)
      }
    }

    return clone(meeting)
  },

  async setProblemResolved(meetingId: string, problemId: string, resolved: boolean): Promise<void> {
    await delay()
    const meeting = items.find((m) => m.id === meetingId)
    if (!meeting) throw new Error('Встреча не найдена')
    const problem = meeting.problems.find((p) => p.id === problemId)
    if (!problem) throw new Error('Проблема не найдена')
    problem.resolved = resolved
    persist()
  },

  async remove(id: string): Promise<void> {
    await delay()
    items = items.filter((m) => m.id !== id)
    persist()
  },
}
