import { apiRequest } from './http'

export class ResourceRepository<T extends { id: number }> {
  private readonly resourcePath: string

  public constructor(resourcePath: string) {
    this.resourcePath = resourcePath
  }

  // получает список сущностей
  public list(): Promise<T[]> {
    return apiRequest<T[]>(this.resourcePath)
  }

  // создает запись
  public create(payload: T): Promise<T> {
    return apiRequest<T>(this.resourcePath, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // обновляет запись целиком
  public update(id: number, payload: T): Promise<T> {
    return apiRequest<T>(`${this.resourcePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  // удаляет запись
  public remove(id: number): Promise<void> {
    return apiRequest<void>(`${this.resourcePath}/${id}`, {
      method: 'DELETE',
    })
  }
}
