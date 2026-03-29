<script setup lang="ts">
import PrinterCard from './PrinterCard.vue'

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
  queue: Array<{ id: number; name: string }>
  currentModel: string | null
}

interface Props {
  printers: PrinterCardData[]
  plasticOptions: OptionItem[]
  modelOptions: OptionItem[]
}

defineProps<Props>()
defineEmits<{
  installPlastic: [printerId: number, plasticId: number]
  removePlastic: [printerId: number]
  addToQueue: [printerId: number, modelId: number]
  removeFromQueue: [printerId: number, modelId: number]
  clearQueue: [printerId: number]
  start: [printerId: number]
  stop: [printerId: number]
  resetError: [printerId: number]
}>()
</script>

<template>
  <section class="home-printers">
    <h2>Принтеры на главной странице</h2>
    <p v-if="printers.length === 0" class="home-printers__empty">
      Пока нет принтеров, добавьте их на странице "Принтеры".
    </p>

    <div v-else class="home-printers__grid">
      <PrinterCard
        v-for="printer in printers"
        :key="printer.id"
        :printer="printer"
        :plastic-options="plasticOptions"
        :model-options="modelOptions"
        @install-plastic="
          (printerId, plasticId) => $emit('installPlastic', printerId, plasticId)
        "
        @remove-plastic="$emit('removePlastic', $event)"
        @add-to-queue="(printerId, modelId) => $emit('addToQueue', printerId, modelId)"
        @remove-from-queue="
          (printerId, modelId) => $emit('removeFromQueue', printerId, modelId)
        "
        @clear-queue="$emit('clearQueue', $event)"
        @start="$emit('start', $event)"
        @stop="$emit('stop', $event)"
        @reset-error="$emit('resetError', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.home-printers {
  background: #eff7fd;
  border-radius: 14px;
  padding: 1rem;
  border: 1px solid #c9dff0;
}

.home-printers h2 {
  margin: 0;
}

.home-printers__empty {
  margin: 0.6rem 0 0;
}

.home-printers__grid {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.8rem;
}

@container (min-width: 760px) {
  .home-printers__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
