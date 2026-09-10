<script setup lang="ts">
withDefaults(defineProps<{ icon?: string; title: string; description?: string }>(), { icon: '📭' })
</script>

<template>
  <div class="empty">
    <div class="empty__icon">{{ icon }}</div>
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-muted);
}
.empty__icon {
  font-size: 34px;
  margin-bottom: 10px;
}
.empty__title {
  font-weight: 600;
  color: var(--color-text);
}
.empty__desc {
  font-size: 13px;
  margin-top: 4px;
}
.empty__action {
  margin-top: 14px;
}
</style>
