import type { Department } from '@/types'
import { delay, loadCollection, saveCollection, uid } from './storage'
import { seedDepartments } from './seed'

let items: Department[] = loadCollection('departments', seedDepartments)

function persist() {
  saveCollection('departments', items)
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

/** All ancestor ids from the department up to (and excluding) the root, nearest first. */
export function getAncestorIds(deptId: string, all: Department[]): string[] {
  const byId = new Map(all.map((d) => [d.id, d]))
  const result: string[] = []
  let current = byId.get(deptId)?.parentId ?? null
  while (current) {
    result.push(current)
    current = byId.get(current)?.parentId ?? null
  }
  return result
}

/** All descendant department ids (not including the department itself). */
export function getDescendantIds(deptId: string, all: Department[]): string[] {
  const children = all.filter((d) => d.parentId === deptId)
  const result: string[] = []
  for (const child of children) {
    result.push(child.id, ...getDescendantIds(child.id, all))
  }
  return result
}

export interface DepartmentNode extends Department {
  children: DepartmentNode[]
}

export function buildTree(all: Department[]): DepartmentNode[] {
  const nodes = new Map<string, DepartmentNode>(all.map((d) => [d.id, { ...d, children: [] }]))
  const roots: DepartmentNode[] = []
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export const departmentsService = {
  async list(): Promise<Department[]> {
    await delay()
    return clone(items)
  },

  async create(data: { name: string; parentId: string | null; managerId: string | null }): Promise<Department> {
    await delay()
    const dept: Department = { id: uid('dept'), ...data }
    items.push(dept)
    persist()
    return clone(dept)
  },

  async update(id: string, patch: Partial<Pick<Department, 'name' | 'parentId' | 'managerId'>>): Promise<Department> {
    await delay()
    const idx = items.findIndex((d) => d.id === id)
    const current = items[idx]
    if (idx === -1 || !current) throw new Error('Подразделение не найдено')
    if (patch.parentId !== undefined) {
      if (patch.parentId === id) throw new Error('Подразделение не может быть родителем самого себя')
      if (patch.parentId && getDescendantIds(id, items).includes(patch.parentId)) {
        throw new Error('Нельзя перенести подразделение в собственное поддерево')
      }
    }
    const updated = { ...current, ...patch }
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
