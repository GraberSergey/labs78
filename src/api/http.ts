import { API_BASE_URL } from '../config/constants'

export class ApiError extends Error {
  public readonly status: number | null

  public constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const RETRY_DELAYS_MS = [0, 250, 700]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

// единый запрос к серверу, чтобы не дублировать fetch во всех репозиториях
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // иногда json-server недоступен в момент старта, поэтому делаем несколько попыток
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = RETRY_DELAYS_MS[attempt]

    if (delay > 0) {
      await sleep(delay)
    }

    let response: Response

    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
        ...init,
      })
    } catch (error) {
      // если запрос отменили вручную, сразу выходим без повторов
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Запрос был прерван.')
      }

      // при временном сбое сети пробуем еще раз
      if (attempt < RETRY_DELAYS_MS.length - 1) {
        continue
      }

      throw new ApiError('Сервер недоступен, проверьте запуск json-server.')
    }

    if (!response.ok) {
      throw new ApiError('Запрос завершился ошибкой.', response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const data = (await response.json()) as T
    return data
  }

  throw new ApiError('Сервер недоступен, проверьте запуск json-server.')
}
