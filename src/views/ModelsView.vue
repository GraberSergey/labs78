<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import EntityList from '../components/EntityList.vue'
import {
  addModel,
  appState,
  copyModel,
  deleteCreatedModel,
  deleteFinishedModel,
  loadAllData,
} from '../store/app-store'

const form = reactive({
  name: '',
  perimeter: 40,
})

// приводит дату к читаемому формату для списка
function formatDate(rawDate: string): string {
  return new Date(rawDate).toLocaleString('ru-RU')
}

// выбирает цвет модели по катушке принтера или по сохраненному значению
function getModelColor(model: (typeof appState.models)[number]): string | null {
  if (model.status === 'finished') {
    return model.lastColor
  }

  if (model.status === 'printing' && model.printerId !== null) {
    const printer = appState.printers.find((item) => item.id === model.printerId)

    if (!printer || printer.installedPlasticId === null) {
      return null
    }

    return (
      appState.plastics.find((plastic) => plastic.id === printer.installedPlasticId)?.color ?? null
    )
  }

  return null
}

// отдельный список только для созданных моделей
const createdItems = computed(() => {
  return appState.models
    .filter((model) => model.status === 'created')
    .map((model) => ({
      id: model.id,
      primaryText: model.name,
      secondaryText: `Периметр: ${model.perimeter} мм, создана: ${formatDate(model.createdAt)}.`,
      createdAt: model.createdAt,
      canDelete: true,
      busyHint: null,
      colorPreview: null,
    }))
})

// отдельный список для тех, что печатаются прямо сейчас
const printingItems = computed(() => {
  return appState.models
    .filter((model) => model.status === 'printing')
    .map((model) => ({
      id: model.id,
      primaryText: model.name,
      secondaryText: `Периметр: ${model.perimeter} мм, создана: ${formatDate(model.createdAt)}.`,
      createdAt: model.createdAt,
      canDelete: false,
      busyHint: 'Модель сейчас в печати.',
      colorPreview: getModelColor(model),
    }))
})

// отдельный список для уже готовых моделей
const finishedItems = computed(() => {
  return appState.models
    .filter((model) => model.status === 'finished')
    .map((model) => ({
      id: model.id,
      primaryText: model.name,
      secondaryText: `Периметр: ${model.perimeter} мм, готова.`,
      createdAt: model.createdAt,
      canDelete: true,
      busyHint: null,
      colorPreview: getModelColor(model),
    }))
})

async function submitNewModel(): Promise<void> {
  if (!form.name.trim()) {
    appState.errorMessage = 'Заполните имя модели.'
    return
  }

  if (form.perimeter <= 0) {
    appState.errorMessage = 'Периметр должен быть больше 0.'
    return
  }

  await addModel({
    name: form.name.trim(),
    perimeter: form.perimeter,
  })

  form.name = ''
  form.perimeter = 40
}

onMounted(async () => {
  // если пользователь пришел на эту страницу первой, подтягиваем данные тут
  if (appState.printers.length === 0 && appState.plastics.length === 0 && appState.models.length === 0) {
    await loadAllData()
  }
})
</script>

<template>
  <section class="models-view">
    <article class="form-card">
      <h2>Добавить модель</h2>
      <form @submit.prevent="submitNewModel">
        <label>
          Имя модели
          <input v-model="form.name" type="text" required />
        </label>
        <label>
          Периметр, мм
          <input v-model.number="form.perimeter" type="number" min="1" required />
        </label>
        <button type="submit">Добавить</button>
      </form>
    </article>

    <div class="models-view__lists">
      <EntityList
        title="Созданные"
        :items="createdItems"
        empty-text="Нет созданных моделей."
        :sortable="true"
        :allow-clone="true"
        @remove="deleteCreatedModel"
        @clone="copyModel"
      />

      <EntityList
        title="В печати"
        :items="printingItems"
        empty-text="Сейчас ничего не печатается."
        :sortable="true"
        @remove="() => {}"
      />

      <EntityList
        title="Готовые"
        :items="finishedItems"
        empty-text="Готовых моделей пока нет."
        :sortable="true"
        @remove="deleteFinishedModel"
      />
    </div>
  </section>
</template>

<style scoped>
.models-view {
  display: grid;
  gap: 1rem;
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
button {
  border-radius: 8px;
  border: 1px solid #8eb4ce;
  padding: 0.35rem 0.5rem;
}

button {
  cursor: pointer;
}

.models-view__lists {
  display: grid;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .models-view__lists {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
