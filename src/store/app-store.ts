import { computed, reactive } from 'vue'
import { ResourceRepository } from '../api/repositories'
import { Printer } from '../domain/printer'
import { Model3D } from '../domain/model3d'
import { ValidationError } from '../domain/errors'
import { PRINT_STEP_DELAY_MS } from '../config/constants'
import type {
  AppState,
  ModelRecord,
  PlasticRecord,
  PrinterRecord,
} from '../types/entities'

// репозитории для работы с тремя разделами db.json
const printerRepository = new ResourceRepository<PrinterRecord>('/printers')
const plasticRepository = new ResourceRepository<PlasticRecord>('/plastics')
const modelRepository = new ResourceRepository<ModelRecord>('/models')

// таймеры нужны чтобы параллельно печатали разные принтеры
const printerTimers = new Map<number, ReturnType<typeof setInterval>>()

// это общий store, из него читают все страницы
export const appState = reactive<AppState>({
  printers: [],
  plastics: [],
  models: [],
  loading: false,
  errorMessage: null,
  actionMessage: null,
})

// показывает короткое уведомление и сам убирает его через пару секунд
function setActionMessage(message: string | null): void {
  appState.actionMessage = message

  if (message !== null) {
    window.setTimeout(() => {
      if (appState.actionMessage === message) {
        appState.actionMessage = null
      }
    }, 3500)
  }
}

// приводит неизвестную ошибку к строке для пользователя
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Неизвестная ошибка.'
}

// выбирает следующий id для json-server на клиенте
function nextId(items: Array<{ id: number }>): number {
  const maxId = items.reduce((max, item) => Math.max(max, item.id), 0)
  return maxId + 1
}

// обновляет запись принтера в текущем состоянии без полной перезагрузки
function setPrinterRecord(updatedPrinter: PrinterRecord): void {
  const index = appState.printers.findIndex((printer) => printer.id === updatedPrinter.id)

  if (index === -1) {
    return
  }

  appState.printers[index] = updatedPrinter
}

// обновляет запись катушки в текущем состоянии без полной перезагрузки
function setPlasticRecord(updatedPlastic: PlasticRecord): void {
  const index = appState.plastics.findIndex((plastic) => plastic.id === updatedPlastic.id)

  if (index === -1) {
    return
  }

  appState.plastics[index] = updatedPlastic
}

// обновляет запись модели в текущем состоянии без полной перезагрузки
function setModelRecord(updatedModel: ModelRecord): void {
  const index = appState.models.findIndex((model) => model.id === updatedModel.id)

  if (index === -1) {
    return
  }

  appState.models[index] = updatedModel
}

function getPrinterById(printerId: number): PrinterRecord {
  const printer = appState.printers.find((item) => item.id === printerId)

  if (!printer) {
    throw new ValidationError('Принтер не найден.')
  }

  return printer
}

function getModelById(modelId: number): ModelRecord {
  const model = appState.models.find((item) => item.id === modelId)

  if (!model) {
    throw new ValidationError('Модель не найдена.')
  }

  return model
}

function getPlasticById(plasticId: number): PlasticRecord {
  const plastic = appState.plastics.find((item) => item.id === plasticId)

  if (!plastic) {
    throw new ValidationError('Катушка не найдена.')
  }

  return plastic
}

// собирает доменный объект принтера из состояния приложения
function hydratePrinter(printerId: number): Printer {
  const printerRecord = getPrinterById(printerId)

  const installedPlastic =
    printerRecord.installedPlasticId === null
      ? null
      : getPlasticById(printerRecord.installedPlasticId)

  const queueModels = printerRecord.queueModelIds
    .map((modelId) => appState.models.find((model) => model.id === modelId) ?? null)
    .filter((model): model is ModelRecord => model !== null)

  const currentModel =
    printerRecord.currentModelId === null
      ? null
      : appState.models.find((model) => model.id === printerRecord.currentModelId) ?? null

  return new Printer({
    printer: printerRecord,
    installedPlastic,
    queueModels,
    currentModel,
  })
}

// подготавливает запись текущей модели к статусу "в печати"
function makeCurrentModelPrintingRecord(printerRecord: PrinterRecord): ModelRecord | null {
  if (printerRecord.currentModelId === null) {
    return null
  }

  const currentModel = getModelById(printerRecord.currentModelId)

  return {
    ...currentModel,
    status: 'printing',
    printerId: printerRecord.id,
  }
}

// запускает таймер печати, чтобы обновлять прогресс
function startPrinterTimer(printerId: number): void {
  if (printerTimers.has(printerId)) {
    return
  }

  const timerId = setInterval(() => {
    void tickPrinter(printerId)
  }, PRINT_STEP_DELAY_MS)

  printerTimers.set(printerId, timerId)
}

function stopPrinterTimer(printerId: number): void {
  const timerId = printerTimers.get(printerId)

  if (!timerId) {
    return
  }

  clearInterval(timerId)
  printerTimers.delete(printerId)
}

async function syncPrinter(printerRecord: PrinterRecord): Promise<void> {
  await printerRepository.update(printerRecord.id, printerRecord)
}

// отдельные sync-методы оставлены, чтобы не дублировать update в бизнес-логике
async function syncPlastic(plasticRecord: PlasticRecord): Promise<void> {
  await plasticRepository.update(plasticRecord.id, plasticRecord)
}

async function syncModel(modelRecord: ModelRecord): Promise<void> {
  await modelRepository.update(modelRecord.id, modelRecord)
}

export const storeGetters = {
  // эти списки нужны на странице моделей и главной
  freeModels: computed(() => appState.models.filter((model) => model.status === 'created')),
  printingModels: computed(() => appState.models.filter((model) => model.status === 'printing')),
  finishedModels: computed(() => appState.models.filter((model) => model.status === 'finished')),
}

// загружает все данные один раз при старте приложения
export async function loadAllData(): Promise<void> {
  appState.loading = true
  appState.errorMessage = null

  try {
    const [printers, plastics, models] = await Promise.all([
      printerRepository.list(),
      plasticRepository.list(),
      modelRepository.list(),
    ])

    appState.printers = printers
    appState.plastics = plastics
    appState.models = models
  } catch (error) {
    appState.errorMessage = formatError(error)
  } finally {
    appState.loading = false
  }
}

export async function addPrinter(input: {
  brand: string
  article: string
  speed: number
}): Promise<void> {
  const printerRecord: PrinterRecord = {
    id: nextId(appState.printers),
    brand: input.brand,
    article: input.article,
    speed: input.speed,
    installedPlasticId: null,
    queueModelIds: [],
    currentModelId: null,
    status: 'idle',
    progress: 0,
    errorMessage: null,
  }

  try {
    const created = await printerRepository.create(printerRecord)
    appState.printers.push(created)
    setActionMessage('Принтер добавлен.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function updatePrinterBasics(input: {
  id: number
  brand: string
  article: string
  speed: number
}): Promise<void> {
  try {
    const printer = hydratePrinter(input.id)

    if (printer.isBusy()) {
      throw new ValidationError('Нельзя редактировать занятый принтер.')
    }

    const source = getPrinterById(input.id)
    const updated: PrinterRecord = {
      ...source,
      brand: input.brand,
      article: input.article,
      speed: input.speed,
    }

    await syncPrinter(updated)
    setPrinterRecord(updated)
    setActionMessage('Принтер обновлен.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function deletePrinter(printerId: number): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)

    if (printer.isBusy()) {
      throw new ValidationError('Сначала снимите катушку и очистите очередь.')
    }

    await printerRepository.remove(printerId)
    appState.printers = appState.printers.filter((printerItem) => printerItem.id !== printerId)
    setActionMessage('Принтер удален.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function addPlastic(input: {
  material: string
  color: PlasticRecord['color']
  totalLength: number
}): Promise<void> {
  const plasticRecord: PlasticRecord = {
    id: nextId(appState.plastics),
    material: input.material,
    color: input.color,
    totalLength: input.totalLength,
    usedLength: 0,
  }

  try {
    const created = await plasticRepository.create(plasticRecord)
    appState.plastics.push(created)
    setActionMessage('Катушка добавлена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function deletePlastic(plasticId: number): Promise<void> {
  try {
    const isInstalled = appState.printers.some(
      (printer) => printer.installedPlasticId === plasticId,
    )

    if (isInstalled) {
      throw new ValidationError('Сначала снимите катушку с принтера.')
    }

    await plasticRepository.remove(plasticId)
    appState.plastics = appState.plastics.filter((plastic) => plastic.id !== plasticId)
    setActionMessage('Катушка удалена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function addModel(input: {
  name: string
  perimeter: number
}): Promise<void> {
  try {
    const createdModel = new Model3D({
      id: nextId(appState.models),
      name: input.name,
      perimeter: input.perimeter,
    }).toRecord()

    const model = await modelRepository.create(createdModel)
    appState.models.push(model)
    setActionMessage('Модель добавлена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function copyModel(modelId: number): Promise<void> {
  try {
    const sourceModel = getModelById(modelId)

    if (sourceModel.status !== 'created') {
      throw new ValidationError('Копировать можно только модель из списка созданных.')
    }

    const copiedModel = new Model3D({
      id: sourceModel.id,
      name: sourceModel.name,
      perimeter: sourceModel.perimeter,
      createdAt: sourceModel.createdAt,
    }).cloneWithId(nextId(appState.models))

    const created = await modelRepository.create(copiedModel)
    appState.models.push(created)
    setActionMessage('Создана копия модели.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function deleteCreatedModel(modelId: number): Promise<void> {
  try {
    const model = getModelById(modelId)

    if (model.status !== 'created') {
      throw new ValidationError('Удалять можно только созданные модели.')
    }

    await modelRepository.remove(modelId)
    appState.models = appState.models.filter((item) => item.id !== modelId)
    setActionMessage('Модель удалена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function installPlasticOnPrinter(
  printerId: number,
  plasticId: number,
): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)
    const plastic = getPlasticById(plasticId)

    printer.installSpool(plastic)

    const updatedPrinter = printer.toRecord()
    await syncPrinter(updatedPrinter)
    setPrinterRecord(updatedPrinter)
    setActionMessage('Катушка установлена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function removePlasticFromPrinter(printerId: number): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)
    printer.removeSpool()

    const updatedPrinter = printer.toRecord()
    await syncPrinter(updatedPrinter)
    setPrinterRecord(updatedPrinter)
    setActionMessage('Катушка снята.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function addModelToPrinterQueue(
  printerId: number,
  modelId: number,
): Promise<void> {
  try {
    const model = getModelById(modelId)

    if (model.status !== 'created') {
      throw new ValidationError('Модель уже используется в другом месте.')
    }

    const printer = hydratePrinter(printerId)
    printer.addToQueue(model)

    const updatedPrinter = printer.toRecord()
    const updatedModel: ModelRecord = {
      ...model,
      status: 'queued',
      printerId,
    }

    // модель и принтер меняются вместе, поэтому сохраняем их одной пачкой
    await Promise.all([syncPrinter(updatedPrinter), syncModel(updatedModel)])

    setPrinterRecord(updatedPrinter)
    setModelRecord(updatedModel)
    setActionMessage('Модель добавлена в очередь.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function startPrinter(printerId: number): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)
    printer.startPrint()

    const updatedPrinter = printer.toRecord()
    // в одном шаге сохраняем и принтер, и статус текущей модели
    const syncTasks: Promise<unknown>[] = [syncPrinter(updatedPrinter)]

    const currentModelRecord = makeCurrentModelPrintingRecord(updatedPrinter)

    if (currentModelRecord !== null) {
      setModelRecord(currentModelRecord)
      syncTasks.push(syncModel(currentModelRecord))
    }

    await Promise.all(syncTasks)
    setPrinterRecord(updatedPrinter)

    if (updatedPrinter.status === 'printing') {
      startPrinterTimer(printerId)
    }

    setActionMessage('Печать запущена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function stopPrinter(printerId: number): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)
    printer.stopPrint()

    const updatedPrinter = printer.toRecord()
    await syncPrinter(updatedPrinter)

    setPrinterRecord(updatedPrinter)
    stopPrinterTimer(printerId)
    setActionMessage('Печать остановлена.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

export async function resetPrinterError(printerId: number): Promise<void> {
  try {
    const printerRecord = getPrinterById(printerId)

    const updated: PrinterRecord = {
      ...printerRecord,
      status: 'idle',
      progress: 0,
      errorMessage: null,
      currentModelId: null,
    }

    if (printerRecord.currentModelId !== null) {
      const failedModel = getModelById(printerRecord.currentModelId)

      const updatedModel: ModelRecord = {
        ...failedModel,
        status: 'created',
        printerId: null,
        lastColor: null,
      }

      // после сброса возвращаем проблемную модель обратно в список созданных
      await Promise.all([syncPrinter(updated), syncModel(updatedModel)])
      setModelRecord(updatedModel)
    } else {
      await syncPrinter(updated)
    }

    setPrinterRecord(updated)
    stopPrinterTimer(printerId)
    setActionMessage('Ошибка сброшена, можно печатать снова.')
  } catch (error) {
    appState.errorMessage = formatError(error)
  }
}

// делает шаг печати и синхронизирует результат в json-server
export async function tickPrinter(printerId: number): Promise<void> {
  try {
    const printer = hydratePrinter(printerId)
    const result = printer.tick()
    const updatedPrinter = printer.toRecord()
    // сюда собираем все запросы обновления и отправляем разом
    const syncTasks: Promise<unknown>[] = []

    const updatedPlastic = printer.getSpool()

    if (updatedPlastic !== null) {
      syncTasks.push(syncPlastic(updatedPlastic))
    }

    if (result.type === 'finished' && result.finishedModelId !== undefined) {
      const finishedModel = getModelById(result.finishedModelId)

      const completedModel: ModelRecord = {
        ...finishedModel,
        status: 'finished',
        printerId: null,
        lastColor: updatedPlastic?.color ?? null,
      }

      syncTasks.push(syncModel(completedModel))
      setModelRecord(completedModel)
    }

    if (result.type === 'error') {
      // при поломке мы помечаем модель как созданную, чтобы ее можно было перепечатать
      if (updatedPrinter.currentModelId !== null) {
        const failedModel = getModelById(updatedPrinter.currentModelId)
        const resetModel: ModelRecord = {
          ...failedModel,
          status: 'created',
          printerId: null,
          lastColor: null,
        }

        syncTasks.push(syncModel(resetModel))
        setModelRecord(resetModel)
      }

      updatedPrinter.currentModelId = null
      updatedPrinter.status = 'error'
      updatedPrinter.progress = 0

      // останавливаем только таймер этого принтера, остальные могут печатать дальше
      stopPrinterTimer(printerId)
    }

    const currentModelRecord = makeCurrentModelPrintingRecord(updatedPrinter)

    if (currentModelRecord !== null) {
      setModelRecord(currentModelRecord)
      syncTasks.push(syncModel(currentModelRecord))
    }

    syncTasks.push(syncPrinter(updatedPrinter))

    // дожидаемся, пока все изменения точно попадут в db.json
    await Promise.all(syncTasks)

    setPrinterRecord(updatedPrinter)

    if (updatedPlastic !== null) {
      setPlasticRecord(updatedPlastic)
    }

    if (updatedPrinter.status !== 'printing') {
      stopPrinterTimer(printerId)
    }
  } catch (error) {
    appState.errorMessage = formatError(error)
    stopPrinterTimer(printerId)
  }
}

export function clearGlobalError(): void {
  appState.errorMessage = null
}

export function clearAllTimers(): void {
  // очищаем таймеры при выходе со страницы, чтобы не висели фоновые интервалы
  for (const printerId of printerTimers.keys()) {
    stopPrinterTimer(printerId)
  }
}
