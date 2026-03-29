<script setup lang="ts">
import { computed, ref } from 'vue'

export interface EntityListItem {
  id: number
  primaryText: string
  secondaryText: string
  createdAt: string | null
  canDelete: boolean
  busyHint: string | null
  colorPreview: string | null
}

interface Props {
  title: string
  items: EntityListItem[]
  emptyText: string
  sortable?: boolean
  allowClone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sortable: false,
  allowClone: false,
})

const emit = defineEmits<{
  remove: [id: number]
  clone: [id: number]
}>()
const sortMode = ref<'name' | 'date'>('name')

// сортирует список только для отображения и не меняет исходный массив
const sortedItems = computed(() => {
  const copy = [...props.items]

  if (sortMode.value === 'name') {
    copy.sort((left, right) => left.primaryText.localeCompare(right.primaryText, 'ru'))
  } else {
    copy.sort((left, right) => {
      const leftDate = left.createdAt ? Date.parse(left.createdAt) : 0
      const rightDate = right.createdAt ? Date.parse(right.createdAt) : 0
      return rightDate - leftDate
    })
  }

  return copy
})

function removeItem(id: number): void {
  emit('remove', id)
}

function cloneItem(id: number): void {
  emit('clone', id)
}
</script>

<template>
  <section class="entity-list">
    <div class="entity-list__top">
      <h2>{{ title }}</h2>
      <label v-if="sortable" class="entity-list__sort">
        Сортировка
        <select v-model="sortMode">
          <option value="name">По имени</option>
          <option value="date">По дате</option>
        </select>
      </label>
    </div>

    <p v-if="items.length === 0" class="entity-list__empty">{{ emptyText }}</p>

    <ul v-else class="entity-list__items">
      <li v-for="item in sortedItems" :key="item.id" class="entity-list__item">
        <div>
          <p class="entity-list__primary">{{ item.primaryText }}</p>
          <p class="entity-list__secondary">{{ item.secondaryText }}</p>
          <p v-if="item.busyHint" class="entity-list__hint">{{ item.busyHint }}</p>
        </div>

        <div class="entity-list__actions">
          <span
            v-if="item.colorPreview"
            class="entity-list__color"
            :style="{ backgroundColor: item.colorPreview }"
          />
          <button
            v-if="allowClone"
            type="button"
            class="entity-list__button entity-list__button--secondary"
            :disabled="!item.canDelete"
            @click="cloneItem(item.id)"
          >
            Копия
          </button>
          <button
            type="button"
            class="entity-list__button"
            :disabled="!item.canDelete"
            @click="removeItem(item.id)"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.entity-list {
  background: #ffffff;
  border: 1px solid #d7e5f0;
  border-radius: 14px;
  padding: 1rem;
}

.entity-list__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.entity-list h2 {
  margin: 0;
  font-size: 1.2rem;
}

.entity-list__sort {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.entity-list__sort select {
  border-radius: 8px;
  border: 1px solid #9bb9cf;
  padding: 0.25rem 0.4rem;
}

.entity-list__empty {
  color: #476276;
  margin: 0.8rem 0 0;
}

.entity-list__items {
  list-style: none;
  margin: 0.8rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.entity-list__item {
  border: 1px solid #d7e5f0;
  border-radius: 10px;
  padding: 0.65rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.entity-list__primary {
  margin: 0;
  font-weight: 700;
}

.entity-list__secondary,
.entity-list__hint {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
}

.entity-list__hint {
  color: #7f1d1d;
}

.entity-list__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.entity-list__color {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  border: 1px solid #456479;
}

.entity-list__button {
  border: 0;
  border-radius: 8px;
  padding: 0.35rem 0.7rem;
  background: #cfedff;
  color: #103a54;
  cursor: pointer;
}

.entity-list__button--secondary {
  background: #f2e8ff;
  color: #472c76;
}

.entity-list__button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
