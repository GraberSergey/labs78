import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EntityList from '../../src/components/EntityList.vue'

function buildItems() {
  return [
    {
      id: 1,
      primaryText: 'beta',
      secondaryText: 'вторая',
      createdAt: '2026-03-28T10:00:00.000Z',
      canDelete: true,
      busyHint: null,
      colorPreview: null,
    },
    {
      id: 2,
      primaryText: 'alpha',
      secondaryText: 'первая',
      createdAt: '2026-03-29T10:00:00.000Z',
      canDelete: true,
      busyHint: null,
      colorPreview: null,
    },
  ]
}

describe('EntityList', () => {
  it('показывает сообщение, если список пуст', () => {
    // подготовка
    const wrapper = mount(EntityList, {
      props: {
        title: 'модели',
        items: [],
        emptyText: 'пусто',
      },
    })

    // проверка
    expect(wrapper.text()).toContain('пусто')
  })

  it('рисует элементы списка и их информацию', () => {
    // подготовка
    const wrapper = mount(EntityList, {
      props: {
        title: 'модели',
        items: buildItems(),
        emptyText: 'пусто',
      },
    })

    // проверка
    expect(wrapper.findAll('.entity-list__item')).toHaveLength(2)
    expect(wrapper.text()).toContain('alpha')
    expect(wrapper.text()).toContain('вторая')
  })

  it('сортирует по имени', () => {
    // подготовка
    const wrapper = mount(EntityList, {
      props: {
        title: 'модели',
        items: buildItems(),
        emptyText: 'пусто',
        sortable: true,
      },
    })

    // проверка
    const firstText = wrapper.findAll('.entity-list__primary')[0].text()
    expect(firstText).toBe('alpha')
  })

  it('сортирует по дате', async () => {
    // подготовка
    const wrapper = mount(EntityList, {
      props: {
        title: 'модели',
        items: buildItems(),
        emptyText: 'пусто',
        sortable: true,
      },
    })

    // действие
    await wrapper.find('select').setValue('date')
    await nextTick()

    // проверка
    const firstText = wrapper.findAll('.entity-list__primary')[0].text()
    expect(firstText).toBe('alpha')
  })

  it('эмитит событие удаления', async () => {
    // подготовка
    const wrapper = mount(EntityList, {
      props: {
        title: 'модели',
        items: buildItems(),
        emptyText: 'пусто',
      },
    })

    // действие
    await wrapper.find('.entity-list__button').trigger('click')

    // проверка
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')[0]).toEqual([2])
  })
})
