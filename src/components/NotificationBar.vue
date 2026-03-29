<script setup lang="ts">
interface Props {
  message: string
  type: 'error' | 'success'
}

defineProps<Props>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div class="notice" :class="`notice--${type}`" role="status">
    <span>{{ message }}</span>
    <button type="button" class="notice__close" @click="$emit('close')">
      Закрыть
    </button>
  </div>
</template>

<style scoped>
.notice {
  border-radius: 12px;
  margin: 0 1rem;
  padding: 0.7rem 0.9rem;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
}

.notice--error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #7f1d1d;
}

.notice--success {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #14532d;
}

.notice__close {
  border: 0;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.12);
  padding: 0.35rem 0.6rem;
  cursor: pointer;
}
</style>
