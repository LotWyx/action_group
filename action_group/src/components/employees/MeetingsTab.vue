<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingsStore } from '@/stores/meetings'
import { useUsersStore } from '@/stores/users'
import { useSkillsStore } from '@/stores/skills'
import { renderMarkdown } from '@/composables/useMarkdown'
import type { User } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { Check, ChevronDown, ChevronUp, Link2, Paperclip } from '@lucide/vue'

const props = defineProps<{ employee: User; canManage: boolean }>()

const meetings = useMeetingsStore()
const users = useUsersStore()
const skills = useSkillsStore()
const router = useRouter()

const list = computed(() => meetings.forUser(props.employee.id))
const expanded = ref<Set<string>>(new Set())

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

function goCreate() {
  router.push({ name: 'meeting-new', params: { id: props.employee.id } })
}
</script>

<template>
  <div class="stack gap-md">
    <div class="row" style="justify-content: flex-end">
      <BaseButton v-if="canManage" size="sm" @click="goCreate">+ Провести встречу (PR)</BaseButton>
    </div>

    <EmptyState v-if="!list.length" title="Встреч пока не было" description="Здесь появится история протоколов PR-встреч" />

    <BaseCard v-for="m in list" :key="m.id" :padded="false" class="meeting">
      <button class="meeting__head" type="button" @click="toggle(m.id)">
        <div>
          <p class="meeting__date">{{ m.date }}</p>
          <p class="text-sm text-muted">Провёл(а): {{ users.fullName(m.conductedById) }}</p>
        </div>
        <div class="row gap-sm">
          <BaseBadge v-if="m.skillMarks.some((s) => s.confirmed)" variant="success">
            {{ m.skillMarks.filter((s) => s.confirmed).length }} навык(ов) подтверждено
          </BaseBadge>
          <BaseBadge v-if="m.problems.some((p) => !p.resolved)" variant="danger">проблема</BaseBadge>
          <ChevronUp v-if="expanded.has(m.id)" :size="15" class="meeting__chevron" />
          <ChevronDown v-else :size="15" class="meeting__chevron" />
        </div>
      </button>

      <div v-if="expanded.has(m.id)" class="meeting__body">
        <div class="markdown-body" v-html="renderMarkdown(m.summaryMarkdown)" />

        <div v-if="m.skillMarks.length" class="meeting__section">
          <p class="meeting__section-title">Отметки по навыкам</p>
          <ul class="meeting__marks">
            <li v-for="mark in m.skillMarks" :key="mark.skillId">
              <BaseBadge :variant="mark.confirmed ? 'success' : 'neutral'">
                <Check v-if="mark.confirmed" :size="12" />
                {{ skills.name(mark.skillId) }}
              </BaseBadge>
              <span v-if="mark.comment" class="text-sm text-muted"> — {{ mark.comment }}</span>
            </li>
          </ul>
        </div>

        <div v-if="m.attachments.length" class="meeting__section">
          <p class="meeting__section-title">Материалы</p>
          <ul class="meeting__attachments">
            <li v-for="a in m.attachments" :key="a.id">
              <a :href="a.url" target="_blank" rel="noopener" class="meeting__attachment-link">
                <Link2 v-if="a.type === 'link'" :size="13" />
                <Paperclip v-else :size="13" />
                {{ a.name }}
              </a>
            </li>
          </ul>
        </div>

        <div v-if="m.problems.length" class="meeting__section">
          <p class="meeting__section-title">Отмеченные проблемы</p>
          <ul class="meeting__problems">
            <li v-for="p in m.problems" :key="p.id" :class="{ 'is-resolved': p.resolved }">
              <BaseBadge :variant="p.resolved ? 'neutral' : 'danger'">
                {{ p.scope === 'skill' ? skills.name(p.skillId ?? '') : 'Общее' }}
              </BaseBadge>
              {{ p.comment }}
            </li>
          </ul>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.meeting__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.meeting__date {
  font-weight: 700;
}

.meeting__chevron {
  color: var(--color-text-faint);
  flex-shrink: 0;
}

.meeting__body {
  padding: 0 16px 16px;
  border-top: 1px solid var(--color-border);
}

.meeting__section {
  margin-top: 14px;
}

.meeting__section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-faint);
  margin-bottom: 8px;
}

.meeting__marks,
.meeting__attachments,
.meeting__problems {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13.5px;
}

.meeting__problems li.is-resolved {
  opacity: 0.55;
  text-decoration: line-through;
}

.meeting__attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-size: 13.5px;
}
</style>
