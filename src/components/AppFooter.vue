<script setup lang="ts">
import { FOOTER_TEXT } from '../config/constants'
</script>

<template>
  <footer class="app-footer">
    <p>{{ FOOTER_TEXT }}</p>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #173247;
  color: #ecf5fb;
  margin: 1rem;
  border-radius: 14px;
  padding: 0.9rem 1rem;
}

.app-footer p {
  margin: 0;
}
</style>
