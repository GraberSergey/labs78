<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import EntityList from '../components/EntityList.vue'
import {
  addPlastic,
  appState,
  deletePlastic,
  loadAllData,
} from '../store/app-store'
import { ALLOWED_COLORS } from '../types/entities'
import { COLOR_LABELS } from '../config/constants'

const form = reactive({
  material: '',
  color: 'white' as (typeof ALLOWED_COLORS)[number],
  totalLength: 100,
})

function getBusyHint(plasticId: number): string | null {
  const printer = appState.printers.find((item) => item.installedPlasticId === plasticId)

  if (!printer) {
    return null
  }

  return `Катушка установлена в принтер ${printer.brand}.`
}

const plasticItems = computed(() => {
  return appState.plastics.map((plastic) => {
    const remaining = plastic.totalLength - plastic.usedLength
    const busyHint = getBusyHint(plastic.id)

    return {
      id: plastic.id,
      primaryText: `${plastic.material}`,
      secondaryText: `Цвет: ${COLOR_LABELS[plastic.color]}, остаток: ${remaining} мм.`,
      createdAt: null,
      canDelete: busyHint === null,
      busyHint,
      colorPreview: plastic.color,
    }
  })
})

async function submitNewPlastic(): Promise<void> {
  if (!form.material.trim()) {
    appState.errorMessage = 'Заполните материал катушки.'
    return
  }

  if (form.totalLength <= 0) {
    appState.errorMessage = 'Длина катушки должна быть больше 0.'
    return
  }

  await addPlastic({
    material: form.material.trim(),
    color: form.color,
    totalLength: form.totalLength,
  })

  form.material = ''
  form.color = 'white'
  form.totalLength = 100
}

onMounted(async () => {
  if (appState.printers.length === 0 && appState.plastics.length === 0 && appState.models.length === 0) {
    await loadAllData()
  }
})
</script>

<template>
  <section class="plastics-view">
    <article class="form-card">
      <h2>Добавить пластик</h2>
      <form @submit.prevent="submitNewPlastic">
        <label>
          Материал
          <input v-model="form.material" type="text" required />
        </label>
        <label>
          Цвет
          <select v-model="form.color">
            <option v-for="color in ALLOWED_COLORS" :key="color" :value="color">
              {{ COLOR_LABELS[color] }}
            </option>
          </select>
        </label>
        <label>
          Длина нити, мм
          <input v-model.number="form.totalLength" type="number" min="1" required />
        </label>
        <button type="submit">Добавить</button>
      </form>
    </article>

    <EntityList
      title="Список катушек"
      :items="plasticItems"
      empty-text="Список пластиков пуст."
      @remove="deletePlastic"
    />
  </section>
</template>

<style scoped>
.plastics-view {
  display: grid;
  gap: 1rem;
  container-type: inline-size;
}

.form-card {
  border: 1px solid #d7e5f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
}

.form-card h2 {
  margin: 0;
}

form {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.55rem;
}

label {
  display: grid;
  gap: 0.25rem;
}

input,
select,
button {
  border-radius: 8px;
  border: 1px solid #8eb4ce;
  padding: 0.35rem 0.5rem;
}

button {
  cursor: pointer;
}

@container (min-width: 860px) {
  .plastics-view {
    grid-template-columns: 330px 1fr;
    align-items: start;
  }
}
</style>
