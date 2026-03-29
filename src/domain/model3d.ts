import type { ModelRecord, ModelStatus } from '../types/entities'

export interface CreateModelParams {
  id: number
  name: string
  perimeter: number
  createdAt?: string
}

export class Model3D {
  public readonly id: number
  public readonly name: string
  public readonly perimeter: number
  public readonly createdAt: string

  public constructor(params: CreateModelParams) {
    this.id = params.id
    this.name = params.name
    this.perimeter = params.perimeter
    this.createdAt = params.createdAt ?? new Date().toISOString()
  }

  // возвращает модель в формате хранилища
  public toRecord(): ModelRecord {
    return {
      id: this.id,
      name: this.name,
      perimeter: this.perimeter,
      createdAt: this.createdAt,
      status: 'created',
      lastColor: null,
      printerId: null,
    }
  }

  // создает копию модели с новым id
  public cloneWithId(id: number): ModelRecord {
    return {
      id,
      name: `${this.name} (копия)`,
      perimeter: this.perimeter,
      createdAt: new Date().toISOString(),
      status: 'created',
      lastColor: null,
      printerId: null,
    }
  }

  // безопасно меняет статус записи модели
  public static withStatus(
    model: ModelRecord,
    status: ModelStatus,
    printerId: number | null,
    lastColor: ModelRecord['lastColor'],
  ): ModelRecord {
    return {
      ...model,
      status,
      printerId,
      lastColor,
    }
  }
}
