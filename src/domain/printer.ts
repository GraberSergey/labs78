import {
  AdhesionError,
  PlasticBreakError,
  PrinterOverheatError,
  ValidationError,
} from './errors'
import type {
  ModelRecord,
  PlasticRecord,
  PrinterRecord,
  PrinterStatus,
  PrinterTickResult,
} from '../types/entities'
import { PlasticSpool } from './plastic-spool'

export interface PrinterHydratePayload {
  printer: PrinterRecord
  installedPlastic: PlasticRecord | null
  queueModels: ModelRecord[]
  currentModel: ModelRecord | null
}

export class Printer {
  public readonly id: number
  public readonly brand: string
  public readonly article: string
  public readonly speed: number

  private status: PrinterStatus
  private errorMessage: string | null
  private progress: number

  private spool: PlasticRecord | null
  private queueModels: ModelRecord[]
  private currentModel: ModelRecord | null

  public constructor(payload: PrinterHydratePayload) {
    this.id = payload.printer.id
    this.brand = payload.printer.brand
    this.article = payload.printer.article
    this.speed = payload.printer.speed

    this.status = payload.printer.status
    this.errorMessage = payload.printer.errorMessage
    this.progress = payload.printer.progress

    this.spool = payload.installedPlastic
    this.queueModels = [...payload.queueModels]
    this.currentModel = payload.currentModel
  }

  // проверяет, что принтер можно редактировать или удалять
  public isBusy(): boolean {
    return (
      this.spool !== null ||
      this.status === 'printing' ||
      this.currentModel !== null ||
      this.queueModels.length > 0
    )
  }

  // ставит катушку, если сейчас свободно место
  public installSpool(spool: PlasticRecord): void {
    if (this.spool !== null) {
      throw new ValidationError('Сначала снимите текущую катушку.')
    }

    this.spool = spool
    this.errorMessage = null
  }

  // снимает катушку, если печать не идет
  public removeSpool(): void {
    if (this.status === 'printing') {
      throw new ValidationError('Нельзя снять катушку во время печати.')
    }

    this.spool = null
  }

  // добавляет модель в очередь и сразу проверяет запас катушки
  public addToQueue(model: ModelRecord): void {
    if (this.spool === null) {
      throw new ValidationError('Сначала установите катушку.')
    }

    const reservedLength = this.queueModels.reduce(
      (sum, queueModel) => sum + queueModel.perimeter,
      0,
    )

    const currentModelLength = this.currentModel?.perimeter ?? 0
    const spool = new PlasticSpool(this.spool.totalLength, this.spool.usedLength)

    if (spool.getRemainingLength() - reservedLength - currentModelLength < model.perimeter) {
      throw new ValidationError('Для этой модели не хватает пластика.')
    }

    this.queueModels.push(model)
    this.errorMessage = null
  }

  // готовит принтер к печати первой модели
  public startPrint(): void {
    if (this.spool === null) {
      throw new ValidationError('Нельзя начать печать без катушки.')
    }

    if (this.currentModel === null && this.queueModels.length === 0) {
      throw new ValidationError('В очереди нет моделей.')
    }

    if (this.currentModel === null) {
      this.currentModel = this.queueModels.shift() ?? null
    }

    this.status = 'printing'
    this.errorMessage = null
  }

  // останавливает печать вручную
  public stopPrint(): void {
    if (this.status === 'printing') {
      this.status = 'idle'
    }
  }

  // делает один шаг печати и возвращает результат
  public tick(randomFn: () => number = Math.random): PrinterTickResult {
    if (this.status !== 'printing' || this.currentModel === null || this.spool === null) {
      return {
        type: 'progress',
        progress: this.progress,
      }
    }

    // первый бросок кубика d6 решает, есть ли поломка на шаге
    if (this.rollDice(randomFn, 6) === 1) {
      const error = this.createRandomError(randomFn)
      this.status = 'error'
      this.errorMessage = error.message

      return {
        type: 'error',
        progress: this.progress,
        errorMessage: error.message,
      }
    }

    const delta = Math.max(5, Math.round(this.speed / 12))
    this.progress = Math.min(100, this.progress + delta)

    if (this.progress < 100) {
      return {
        type: 'progress',
        progress: this.progress,
      }
    }

    const finishedModel = this.currentModel
    const spool = new PlasticSpool(this.spool.totalLength, this.spool.usedLength)

    spool.consume(finishedModel.perimeter)

    this.spool = {
      ...this.spool,
      usedLength: spool.getUsedLength(),
    }

    this.progress = 0
    this.currentModel = this.queueModels.shift() ?? null
    this.status = this.currentModel === null ? 'idle' : 'printing'

    return {
      type: 'finished',
      progress: this.progress,
      finishedModelId: finishedModel.id,
    }
  }

  // возвращает актуальный снимок принтера
  public toRecord(): PrinterRecord {
    return {
      id: this.id,
      brand: this.brand,
      article: this.article,
      speed: this.speed,
      installedPlasticId: this.spool?.id ?? null,
      queueModelIds: this.queueModels.map((model) => model.id),
      currentModelId: this.currentModel?.id ?? null,
      status: this.status,
      progress: this.progress,
      errorMessage: this.errorMessage,
    }
  }

  public getSpool(): PlasticRecord | null {
    return this.spool
  }

  public getQueue(): ModelRecord[] {
    return [...this.queueModels]
  }

  public getCurrentModel(): ModelRecord | null {
    return this.currentModel
  }

  private createRandomError(randomFn: () => number) {
    // второй бросок d3 определяет причину поломки
    const reasonDice = this.rollDice(randomFn, 3)

    if (reasonDice === 1) {
      return new PlasticBreakError()
    }

    if (reasonDice === 2) {
      return new PrinterOverheatError()
    }

    return new AdhesionError()
  }

  // бросок кубика на нужное число граней
  private rollDice(randomFn: () => number, sides: number): number {
    return Math.floor(randomFn() * sides) + 1
  }
}
