<script setup lang="ts">
import { computed, onMounted } from 'vue'
import HomePrinterPanel from '../components/HomePrinterPanel.vue'
import {
  addModelToPrinterQueue,
  appState,
  installPlasticOnPrinter,
  loadAllData,
  removePlasticFromPrinter,
  resetPrinterError,
  startPrinter,
  stopPrinter,
} from '../store/app-store'
import { COLOR_LABELS } from '../config/constants'

// собирает понятную подпись катушки для карточки принтера
function getPlasticLabel(plasticId: number | null): string | null {
  if (plasticId === null) {
    return null
  }

  const plastic = appState.plastics.find((item) => item.id === plasticId)

  if (!plastic) {
    return null
  }

  const remaining = plastic.totalLength - plastic.usedLength
  return `${plastic.material}, ${COLOR_LABELS[plastic.color]}, остаток ${remaining}`
}

// ищет имя модели по id, чтобы показать его в интерфейсе
function getModelName(modelId: number | null): string | null {
  if (modelId === null) {
    return null
  }

  return appState.models.find((model) => model.id === modelId)?.name ?? null
}

// готовит данные карточек принтеров для главной страницы
const printerCards = computed(() => {
  return appState.printers.map((printer) => ({
    id: printer.id,
    title: `Принтер ${printer.brand}`,
    article: `Артикул: ${printer.article}`,
    status: printer.status,
    statusLabel:
      printer.status === 'idle'
        ? 'Свободен'
        : printer.status === 'printing'
          ? 'Печатает'
          : 'Ошибка',
    progress: printer.progress,
    errorMessage: printer.errorMessage,
    installedPlastic: getPlasticLabel(printer.installedPlasticId),
    queue: printer.queueModelIds
      .map((modelId) => appState.models.find((model) => model.id === modelId)?.name ?? null)
      .filter((name): name is string => name !== null),
    currentModel: getModelName(printer.currentModelId),
  }))
})

// в выпадающем списке показываем только свободные катушки
const freePlasticOptions = computed(() => {
  return appState.plastics
    .filter((plastic) => {
      return !appState.printers.some(
        (printer) => printer.installedPlasticId === plastic.id,
      )
    })
    .map((plastic) => {
      const remaining = plastic.totalLength - plastic.usedLength

      return {
        id: plastic.id,
        label: `${plastic.material}, ${COLOR_LABELS[plastic.color]}, остаток ${remaining}`,
      }
    })
})

// в очередь можно поставить только модели со статусом created
const freeModelOptions = computed(() => {
  return appState.models
    .filter((model) => model.status === 'created')
    .map((model) => ({
      id: model.id,
      label: `${model.name} (${model.perimeter}мм)`,
    }))
})

const createdModels = computed(() => appState.models.filter((model) => model.status === 'created'))

onMounted(async () => {
  // защищаемся от повторного запроса, если данные уже загружены
  if (appState.printers.length === 0 && appState.plastics.length === 0 && appState.models.length === 0) {
    await loadAllData()
  }
})
</script>

<template>
  <section class="home-view">
    <div class="home-view__intro">
      <h2>Общая сводка</h2>
      <div class="home-view__lists">
        <article>
          <img src="/images/model.svg" alt="Иконка модели" width="20" height="20" />
          <h3>Созданные модели</h3>
          <p>{{ createdModels.length }} шт.</p>
        </article>
        <article>
          <img src="/images/plastic.svg" alt="Иконка катушки" width="20" height="20" />
          <h3>Пластики</h3>
          <p>{{ appState.plastics.length }} шт.</p>
        </article>
        <article>
          <img src="/images/printer.svg" alt="Иконка принтера" width="20" height="20" />
          <h3>Принтеры</h3>
          <p>{{ appState.printers.length }} шт.</p>
        </article>
      </div>
    </div>

    <HomePrinterPanel
      :printers="printerCards"
      :plastic-options="freePlasticOptions"
      :model-options="freeModelOptions"
      @install-plastic="installPlasticOnPrinter"
      @remove-plastic="removePlasticFromPrinter"
      @add-to-queue="addModelToPrinterQueue"
      @start="startPrinter"
      @stop="stopPrinter"
      @reset-error="resetPrinterError"
    />
  </section>
</template>

<style scoped>
.home-view {
  display: grid;
  gap: 1rem;
  container-type: inline-size;
}

.home-view__intro {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #d7e5f0;
  padding: 1rem;
}

.home-view__intro h2 {
  margin: 0;
}

.home-view__lists {
  margin-top: 0.7rem;
  display: grid;
  gap: 0.7rem;
}

.home-view__lists article {
  border-radius: 10px;
  background: #f2f8fc;
  padding: 0.8rem;
  display: grid;
  gap: 0.2rem;
}

.home-view__lists article h3,
.home-view__lists article p {
  margin: 0;
}

@container (min-width: 740px) {
  .home-view__lists {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
