// статусы принтера в процессе работы
export type PrinterStatus = 'idle' | 'printing' | 'error'
// статусы модели от создания до готовности
export type ModelStatus = 'created' | 'queued' | 'printing' | 'finished'

// разрешенные цвета катушек по условию лабораторной
export type PlasticColor =
  | 'white'
  | 'black'
  | 'red'
  | 'green'
  | 'blue'

// список цветов для выпадающего списка в форме
export const ALLOWED_COLORS: PlasticColor[] = [
  'white',
  'black',
  'red',
  'green',
  'blue',
]

// запись принтера в db.json
export interface PrinterRecord {
  id: number
  brand: string
  article: string
  speed: number
  installedPlasticId: number | null
  queueModelIds: number[]
  currentModelId: number | null
  status: PrinterStatus
  progress: number
  errorMessage: string | null
}

// запись катушки в db.json
export interface PlasticRecord {
  id: number
  material: string
  color: PlasticColor
  totalLength: number
  usedLength: number
}

// запись модели в db.json
export interface ModelRecord {
  id: number
  name: string
  perimeter: number
  createdAt: string
  status: ModelStatus
  lastColor: PlasticColor | null
  printerId: number | null
}

// единое состояние приложения на клиенте
export interface AppState {
  printers: PrinterRecord[]
  plastics: PlasticRecord[]
  models: ModelRecord[]
  loading: boolean
  errorMessage: string | null
  actionMessage: string | null
}

// результат одного шага печати
export interface PrinterTickResult {
  type: 'progress' | 'finished' | 'error'
  progress: number
  errorMessage?: string
  finishedModelId?: number
}
