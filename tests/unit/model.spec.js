import { describe, expect, it } from 'vitest'
import { Model3D } from '../../src/domain/model3d'

describe('Model3D', () => {
  it('инициализируется со всеми нужными полями', () => {
    // подготовка
    const createdAt = '2026-03-29T18:00:00.000Z'

    // действие
    const model = new Model3D({
      id: 7,
      name: 'корпус датчика',
      perimeter: 64,
      createdAt,
    }).toRecord()

    // проверка
    expect(model).toEqual({
      id: 7,
      name: 'корпус датчика',
      perimeter: 64,
      createdAt,
      status: 'created',
      lastColor: null,
      printerId: null,
    })
  })
})
