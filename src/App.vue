<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import NotificationBar from './components/NotificationBar.vue'
import {
  appState,
  clearAllTimers,
  clearGlobalError,
  loadAllData,
} from './store/app-store'

onMounted(async () => {
  await loadAllData()
})

onBeforeUnmount(() => {
  clearAllTimers()
})
</script>

<template>
  <div class="app-layout">
    <AppHeader />

    <NotificationBar
      v-if="appState.errorMessage"
      :message="appState.errorMessage"
      type="error"
      @close="clearGlobalError"
    />

    <NotificationBar
      v-if="appState.actionMessage"
      :message="appState.actionMessage"
      type="success"
      @close="appState.actionMessage = null"
    />

    <main class="app-main">
      <p v-if="appState.loading" class="app-loading">Загрузка данных...</p>
      <RouterView v-else />
    </main>

    <AppFooter />
  </div>
</template>
