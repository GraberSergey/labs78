<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  addPrinter,
  appState,
  deletePrinter,
  loadAllData,
  updatePrinterBasics,
} from '../store/app-store'

const form = reactive({
  brand: '',
  article: '',
  speed: 60,
})

const editId = ref<number | null>(null)
const editForm = reactive({
  brand: '',
  article: '',
  speed: 60,
})

// показывает почему принтер считается занятым
function busyReason(printer: (typeof appState.printers)[number]): string | null {
  if (printer.status === 'printing') {
    return 'Принтер печатает, сначала остановите печать.'
  }

  if (printer.installedPlasticId !== null) {
    return 'Снимите катушку с принтера.'
  }

  if (printer.currentModelId !== null || printer.queueModelIds.length > 0) {
    return 'Очистите очередь печати.'
  }

  return null
}

const printerRows = computed(() => {
  return appState.printers.map((printer) => ({
    ...printer,
    reason: busyReason(printer),
  }))
})

async function submitNewPrinter(): Promise<void> {
  if (!form.brand.trim() || !form.article.trim()) {
    appState.errorMessage = 'Заполните марку и артикул.'
    return
  }

  if (form.speed <= 0) {
    appState.errorMessage = 'Скорость должна быть больше 0.'
    return
  }

  await addPrinter({
    brand: form.brand.trim(),
    article: form.article.trim(),
    speed: form.speed,
  })

  form.brand = ''
  form.article = ''
  form.speed = 60
}

function startEdit(printer: (typeof appState.printers)[number]): void {
  editId.value = printer.id
  editForm.brand = printer.brand
  editForm.article = printer.article
  editForm.speed = printer.speed
}

function cancelEdit(): void {
  editId.value = null
}

async function submitEdit(printerId: number): Promise<void> {
  if (!editForm.brand.trim() || !editForm.article.trim()) {
    appState.errorMessage = 'Заполните марку и артикул.'
    return
  }

  if (editForm.speed <= 0) {
    appState.errorMessage = 'Скорость должна быть больше 0.'
    return
  }

  await updatePrinterBasics({
    id: printerId,
    brand: editForm.brand.trim(),
    article: editForm.article.trim(),
    speed: editForm.speed,
  })

  editId.value = null
}

onMounted(async () => {
  if (appState.printers.length === 0 && appState.plastics.length === 0 && appState.models.length === 0) {
    await loadAllData()
  }
})
</script>

<template>
  <section class="printers-view">
    <article class="form-card">
      <h2>Добавить принтер</h2>
      <form @submit.prevent="submitNewPrinter">
        <label>
          Марка
          <input v-model="form.brand" type="text" required />
        </label>
        <label>
          Артикул
          <input v-model="form.article" type="text" required />
        </label>
        <label>
          Скорость печати
          <input v-model.number="form.speed" type="number" min="1" required />
        </label>
        <button type="submit">Добавить</button>
      </form>
    </article>

    <article class="list-card">
      <h2>Список принтеров</h2>
      <p v-if="printerRows.length === 0">Список пуст.</p>

      <ul v-else>
        <li v-for="printer in printerRows" :key="printer.id">
          <template v-if="editId === printer.id">
            <div class="printer-edit">
              <label>
                Марка
                <input v-model="editForm.brand" type="text" required />
              </label>
              <label>
                Артикул
                <input v-model="editForm.article" type="text" required />
              </label>
              <label>
                Скорость
                <input v-model.number="editForm.speed" type="number" min="1" required />
              </label>
              <div class="printer-buttons">
                <button type="button" @click="submitEdit(printer.id)">Сохранить</button>
                <button type="button" @click="cancelEdit">Отмена</button>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="printer-row">
              <div>
                <p><strong>{{ printer.brand }}</strong> ({{ printer.article }})</p>
                <p>Скорость: {{ printer.speed }}</p>
                <p v-if="printer.reason" class="printer-busy">{{ printer.reason }}</p>
              </div>
              <div class="printer-buttons">
                <button
                  type="button"
                  :disabled="Boolean(printer.reason)"
                  @click="startEdit(printer)"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  :disabled="Boolean(printer.reason)"
                  @click="deletePrinter(printer.id)"
                >
                  Удалить
                </button>
              </div>
            </div>
          </template>
        </li>
      </ul>
    </article>
  </section>
</template>

<style scoped>
.printers-view {
  display: grid;
  gap: 1rem;
  container-type: inline-size;
}

.form-card,
.list-card {
  border: 1px solid #d7e5f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 1rem;
}

.form-card h2,
.list-card h2 {
  margin: 0;
}

form,
.printer-edit {
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

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.list-card ul {
  list-style: none;
  margin: 0.7rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
}

.printer-row {
  border: 1px solid #d7e5f0;
  border-radius: 10px;
  background: #f5f9fc;
  padding: 0.65rem;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.printer-row p,
.printer-edit p {
  margin: 0;
}

.printer-busy {
  margin-top: 0.3rem;
  color: #7f1d1d;
}

.printer-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

@container (min-width: 860px) {
  .printers-view {
    grid-template-columns: 330px 1fr;
    align-items: start;
  }
}
</style>
