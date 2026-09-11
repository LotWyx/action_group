<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useDepartmentsStore } from '@/stores/departments'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import BottomNav from './BottomNav.vue'

// Nav visibility depends on usePermissions().hasSubordinates, which needs
// these two stores loaded regardless of which view mounts first. AppShell
// can mount briefly before the router's initial navigation resolves
// (vue-router's START_LOCATION has no meta yet), so skip while logged out
// and swallow errors — a real, authenticated view will fetch these anyway.
onMounted(() => {
  if (!useAuthStore().isAuthenticated) return
  useUsersStore().fetchAll().catch(() => {})
  useDepartmentsStore().fetchAll().catch(() => {})
})
</script>

<template>
  <div class="shell">
    <AppHeader />
    <div class="shell__body">
      <AppSidebar class="shell__sidebar" />
      <main class="shell__main container">
        <router-view v-slot="{ Component, route }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </main>
    </div>
    <BottomNav class="shell__bottom-nav" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.shell__body {
  display: flex;
}

.shell__sidebar {
  display: none;
}

.shell__main {
  flex: 1;
  min-width: 0;
  padding-block: 20px;
  padding-bottom: calc(var(--bottom-nav-height) + 24px);
}

.shell__bottom-nav {
  display: flex;
}

@media (min-width: 861px) {
  .shell__sidebar {
    display: block;
  }
  .shell__main {
    padding-block: 28px;
  }
  .shell__bottom-nav {
    display: none;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
