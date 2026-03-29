import { describe, expect, it } from 'vitest'
import { PlasticSpool } from '../../src/domain/plastic-spool'

describe('PlasticSpool', () => {
  it('корректно хранит длину при создании', () => {
    // подготовка и действие
    const spool = new PlasticSpool(300, 50)

    // проверка
    expect(spool.getUsedLength()).toBe(50)
  })

  it('правильно считает оставшуюся длину', () => {
    // подготовка
    const spool = new PlasticSpool(300, 50)

    // действие
    spool.consume(25)

    // проверка
    expect(spool.getRemainingLength()).toBe(225)
  })
})
