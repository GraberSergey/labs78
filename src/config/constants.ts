import type { PlasticColor } from '../types/entities'

export const API_BASE_URL = 'http://localhost:3001'
export const PRINT_STEP_DELAY_MS = 1000

export const COLOR_LABELS: Record<PlasticColor, string> = {
  white: 'белый',
  black: 'черный',
  red: 'красный',
  green: 'зеленый',
  blue: 'синий',
}

export const FOOTER_TEXT = 'Грабер Сергей Дмитриевич, группа 221-323'
