import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HomePrinterPanel from '../../src/components/HomePrinterPanel.vue'

function buildProps() {
  return {
    printers: [
      {
        id: 1,
        title: 'принтер Test',
        article: 'артикул: T-1',
        statusLabel: 'печатает',
        status: 'printing',
        progress: 35,
        errorMessage: null,
        installedPlastic: 'PLA, белый, остаток 120',
        queue: [
          { id: 101, name: 'деталь 1' },
          { id: 102, name: 'деталь 2' },
        ],
        currentModel: 'деталь 1',
      },
      {
        id: 2,
        title: 'принтер Broken',
        article: 'артикул: B-2',
        statusLabel: 'ошибка',
        status: 'error',
        progress: 55,
        errorMessage: 'перегрев принтера',
        installedPlastic: 'PETG, красный, остаток 80',
        queue: [],
        currentModel: null,
      },
    ],
    plasticOptions: [
      {
        id: 1,
        label: 'PLA белый',
      },
    ],
    modelOptions: [
      {
        id: 10,
        label: 'деталь 1',
      },
    ],
  }
}

describe('HomePrinterPanel', () => {
  it('рисует принтеры и очереди', () => {
    // подготовка
    const wrapper = mount(HomePrinterPanel, {
      props: buildProps(),
    })

    // проверка
    expect(wrapper.findAll('.printer-card')).toHaveLength(2)
    expect(wrapper.text()).toContain('деталь 2')
  })

  it('показывает процент готовности', () => {
    // подготовка
    const wrapper = mount(HomePrinterPanel, {
      props: buildProps(),
    })

    // проверка
    expect(wrapper.text()).toContain('35%')
    expect(wrapper.text()).toContain('55%')
  })

  it('показывает сообщение об ошибке принтера', () => {
    // подготовка
    const wrapper = mount(HomePrinterPanel, {
      props: buildProps(),
    })

    // проверка
    expect(wrapper.text()).toContain('Ошибка: перегрев принтера')
  })
})
