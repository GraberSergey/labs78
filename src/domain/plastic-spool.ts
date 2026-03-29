import { ValidationError } from './errors'

export class PlasticSpool {
  public readonly totalLength: number
  private usedLength: number

  public constructor(totalLength: number, usedLength = 0) {
    if (totalLength <= 0) {
      throw new ValidationError('Длина катушки должна быть больше 0.')
    }

    if (usedLength < 0 || usedLength > totalLength) {
      throw new ValidationError('Использованная длина некорректна.')
    }

    this.totalLength = totalLength
    this.usedLength = usedLength
  }

  // показывает сколько нити осталось
  public getRemainingLength(): number {
    return this.totalLength - this.usedLength
  }

  // уменьшает запас нити после завершения печати
  public consume(length: number): void {
    if (length <= 0) {
      throw new ValidationError('Расход должен быть больше 0.')
    }

    if (length > this.getRemainingLength()) {
      throw new ValidationError('Недостаточно пластика на катушке.')
    }

    this.usedLength += length
  }

  // возвращает внутреннее состояние в числа
  public getUsedLength(): number {
    return this.usedLength
  }
}
