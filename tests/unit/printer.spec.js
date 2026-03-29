import { describe, expect, it } from 'vitest'
import { Printer } from '../../src/domain/printer'

function buildPrinterPayload({ spool = null, queue = [], currentModel = null } = {}) {
  return {
    printer: {
      id: 1,
      brand: 'Test Printer',
      article: 'TP-001',
      speed: 80,
      installedPlasticId: spool?.id ?? null,
      queueModelIds: queue.map((model) => model.id),
      currentModelId: currentModel?.id ?? null,
      status: 'idle',
      progress: 0,
      errorMessage: null,
    },
    installedPlastic: spool,
    queueModels: queue,
    currentModel,
  }
}

function buildModel(id = 1) {
  return {
    id,
    name: `Model ${id}`,
    perimeter: 50,
    createdAt: '2026-03-29T18:00:00.000Z',
    status: 'created',
    lastColor: null,
    printerId: null,
  }
}

function buildSpool() {
  return {
    id: 1,
    material: 'PLA',
    color: 'white',
    totalLength: 200,
    usedLength: 0,
  }
}

describe('Printer', () => {
  it('меняет статус на печать после запуска', () => {
    // подготовка
    const printer = new Printer(
      buildPrinterPayload({
        spool: buildSpool(),
        queue: [buildModel()],
      }),
    )

    // действие
    printer.startPrint()

    // проверка
    expect(printer.toRecord().status).toBe('printing')
  })

  it('выбрасывает ошибку запуска, если нет модели', () => {
    // подготовка
    const printer = new Printer(
      buildPrinterPayload({
        spool: buildSpool(),
        queue: [],
      }),
    )

    // действие и проверка
    expect(() => printer.startPrint()).toThrow('В очереди нет моделей.')
  })

  it('выбрасывает ошибку запуска, если нет катушки', () => {
    // подготовка
    const printer = new Printer(
      buildPrinterPayload({
        spool: null,
        queue: [buildModel()],
      }),
    )

    // действие и проверка
    expect(() => printer.startPrint()).toThrow('Нельзя начать печать без катушки.')
  })

  it('устанавливает катушку', () => {
    // подготовка
    const printer = new Printer(buildPrinterPayload())

    // действие
    printer.installSpool(buildSpool())

    // проверка
    expect(printer.toRecord().installedPlasticId).toBe(1)
  })

  it('не дает установить вторую катушку', () => {
    // подготовка
    const spool = buildSpool()
    const printer = new Printer(buildPrinterPayload({ spool }))

    // действие и проверка
    expect(() => printer.installSpool(buildSpool())).toThrow(
      'Сначала снимите текущую катушку.',
    )
  })

  it('не дает снять катушку при печати', () => {
    // подготовка
    const printer = new Printer(
      buildPrinterPayload({
        spool: buildSpool(),
        queue: [buildModel()],
      }),
    )
    printer.startPrint()

    // действие и проверка
    expect(() => printer.removeSpool()).toThrow('Нельзя снять катушку во время печати.')
  })
})
