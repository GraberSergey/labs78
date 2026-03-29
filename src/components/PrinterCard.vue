<script setup lang="ts">
import { computed, ref } from 'vue'

interface OptionItem {
  id: number
  label: string
}

interface PrinterCardData {
  id: number
  title: string
  article: string
  statusLabel: string
  status: 'idle' | 'printing' | 'error'
  progress: number
  errorMessage: string | null
  installedPlastic: string | null
  queue: string[]
  currentModel: string | null
}

interface Props {
  printer: PrinterCardData
  plasticOptions: OptionItem[]
  modelOptions: OptionItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  installPlastic: [printerId: number, plasticId: number]
  removePlastic: [printerId: number]
  addToQueue: [printerId: number, modelId: number]
  start: [printerId: number]
  stop: [printerId: number]
  resetError: [printerId: number]
}>()

const selectedPlasticId = ref<number | null>(null)
const selectedModelId = ref<number | null>(null)

const canStart = computed(
  () => props.printer.status !== 'printing' && props.printer.queue.length > 0,
)

function installPlastic(): void {
  if (selectedPlasticId.value === null) {
    return
  }

  emit('installPlastic', props.printer.id, selectedPlasticId.value)
  selectedPlasticId.value = null
}

function queueModel(): void {
  if (selectedModelId.value === null) {
    return
  }

  emit('addToQueue', props.printer.id, selectedModelId.value)
  selectedModelId.value = null
}
</script>

<template>
  <article class="printer-card">
    <header class="printer-card__header">
      <h3>{{ printer.title }}</h3>
      <p>{{ printer.article }}</p>
      <span class="printer-card__status" :class="`printer-card__status--${printer.status}`">
        {{ printer.statusLabel }}
      </span>
    </header>

    <p class="printer-card__line">
      <strong>Установленный пластик:</strong>
      <span>{{ printer.installedPlastic ?? 'Не установлен' }}</span>
    </p>

    <p class="printer-card__line">
      <strong>Текущая модель:</strong>
      <span>{{ printer.currentModel ?? 'Не выбрана' }}</span>
    </p>

    <p class="printer-card__line">
      <strong>Прогресс:</strong>
      <span>{{ printer.progress }}%</span>
    </p>

    <p v-if="printer.errorMessage" class="printer-card__error">Ошибка: {{ printer.errorMessage }}</p>

    <div class="printer-card__queue">
      <h4>Очередь</h4>
      <p v-if="printer.queue.length === 0">Очередь пустая.</p>
      <ol v-else>
        <li v-for="modelName in printer.queue" :key="`${printer.id}-${modelName}`">{{ modelName }}</li>
      </ol>
    </div>

    <div class="printer-card__controls">
      <label>
        Выбрать катушку
        <select v-model.number="selectedPlasticId">
          <option :value="null">-</option>
          <option v-for="plastic in plasticOptions" :key="plastic.id" :value="plastic.id">
            {{ plastic.label }}
          </option>
        </select>
      </label>
      <button type="button" @click="installPlastic">Поставить</button>
      <button type="button" @click="emit('removePlastic', printer.id)">Снять</button>
    </div>

    <div class="printer-card__controls">
      <label>
        Модель в очередь
        <select v-model.number="selectedModelId">
          <option :value="null">-</option>
          <option v-for="model in modelOptions" :key="model.id" :value="model.id">
            {{ model.label }}
          </option>
        </select>
      </label>
      <button type="button" @click="queueModel">Добавить</button>
    </div>

    <div class="printer-card__buttons">
      <button type="button" :disabled="!canStart" @click="emit('start', printer.id)">Запуск</button>
      <button type="button" :disabled="printer.status !== 'printing'" @click="emit('stop', printer.id)">
        Стоп
      </button>
      <button type="button" :disabled="printer.status !== 'error'" @click="emit('resetError', printer.id)">
        Сброс ошибки
      </button>
    </div>
  </article>
</template>

<style scoped>
.printer-card {
  border: 1px solid #b8d4e6;
  border-radius: 12px;
  padding: 0.9rem;
  background: #ffffff;
}

.printer-card__header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.printer-card__header p {
  margin: 0.2rem 0 0;
  color: #395b73;
}

.printer-card__status {
  margin-top: 0.45rem;
  display: inline-block;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.84rem;
}

.printer-card__status--idle {
  background: #dbeafe;
  color: #1e3a8a;
}

.printer-card__status--printing {
  background: #dcfce7;
  color: #166534;
}

.printer-card__status--error {
  background: #fee2e2;
  color: #991b1b;
}

.printer-card__line {
  margin: 0.45rem 0 0;
  display: grid;
  gap: 0.2rem;
}

.printer-card__error {
  margin: 0.5rem 0 0;
  color: #991b1b;
  font-weight: 700;
}

.printer-card__queue {
  margin-top: 0.75rem;
  background: #f2f8fc;
  border-radius: 10px;
  padding: 0.6rem;
}

.printer-card__queue h4 {
  margin: 0;
}

.printer-card__queue p,
.printer-card__queue ol {
  margin: 0.35rem 0 0;
}

.printer-card__controls {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.4rem;
}

.printer-card__controls label {
  display: grid;
  gap: 0.35rem;
}

.printer-card__controls select,
.printer-card__controls button,
.printer-card__buttons button {
  border-radius: 8px;
  border: 1px solid #91b9d4;
  padding: 0.35rem 0.55rem;
}

.printer-card__buttons {
  margin-top: 0.7rem;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
