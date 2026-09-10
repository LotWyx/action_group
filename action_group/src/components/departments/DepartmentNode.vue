<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import type { DepartmentNode } from '@/api/departmentsService'
import BaseBadge from '@/components/ui/BaseBadge.vue'

defineProps<{ node: DepartmentNode; depth: number; employeeCount: (id: string) => number }>()
const emit = defineEmits<{ 'add-child': [parentId: string]; edit: [id: string]; remove: [id: string] }>()

const users = useUsersStore()
const router = useRouter()
const collapsed = ref(false)
</script>

<template>
  <div class="node">
    <div class="node__row" :style="{ paddingLeft: depth * 20 + 'px' }">
      <button v-if="node.children.length" type="button" class="node__toggle" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }}
      </button>
      <span v-else class="node__toggle-spacer" />
      <span class="node__name">{{ node.name }}</span>
      <BaseBadge variant="neutral">{{ employeeCount(node.id) }} сотр.</BaseBadge>
      <span v-if="node.managerId" class="text-sm text-muted node__manager">
        Руководитель: {{ users.fullName(node.managerId) }}
      </span>
      <span v-else class="text-sm text-faint node__manager">Руководитель не назначен</span>

      <div class="node__actions">
        <button type="button" title="Сотрудники подразделения" @click="router.push({ path: '/employees', query: { dept: node.id } })">👥</button>
        <button type="button" title="Добавить дочернее" @click="emit('add-child', node.id)">＋</button>
        <button type="button" title="Редактировать" @click="emit('edit', node.id)">✎</button>
        <button type="button" title="Удалить" @click="emit('remove', node.id)">🗑</button>
      </div>
    </div>

    <template v-if="!collapsed">
      <DepartmentNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :employee-count="employeeCount"
        @add-child="(id) => emit('add-child', id)"
        @edit="(id) => emit('edit', id)"
        @remove="(id) => emit('remove', id)"
      />
    </template>
  </div>
</template>

<style scoped>
.node__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
}

.node__toggle,
.node__toggle-spacer {
  width: 18px;
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-faint);
}

.node__name {
  font-weight: 700;
  font-size: 14px;
}

.node__manager {
  margin-left: auto;
  white-space: nowrap;
}

.node__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.node__actions button {
  border: none;
  background: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  font-size: 13px;
}
.node__actions button:hover {
  background: var(--color-surface-alt);
}

@media (max-width: 640px) {
  .node__manager {
    display: none;
  }
}
</style>
