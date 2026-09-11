<script setup lang="ts">
import { computed } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { primaryNav } from './navItems'

const perm = usePermissions()

const visibleNav = computed(() =>
  primaryNav.filter((item) => !item.requiresSubordinates || perm.isAdmin.value || perm.hasSubordinates.value),
)
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="item in visibleNav"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      active-class="bottom-nav__item--active"
    >
      <component :is="item.icon" :size="19" class="bottom-nav__icon" />
      <span class="bottom-nav__label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--bottom-nav-height);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: var(--color-text-faint);
  font-size: 11px;
  font-weight: 600;
}


.bottom-nav__item--active {
  color: var(--color-primary);
}
</style>
