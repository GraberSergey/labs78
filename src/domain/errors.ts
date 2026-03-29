// базовая ошибка печати, чтобы хранить все поломки в одном типе
export class PrintError extends Error {
  public readonly reasonCode: string

  public constructor(message: string, reasonCode: string) {
    super(message)
    this.name = 'PrintError'
    this.reasonCode = reasonCode
  }
}

// ошибка если оборвалась нить
export class PlasticBreakError extends PrintError {
  public constructor() {
    super('Обрыв нити пластика.', 'PLASTIC_BREAK')
    this.name = 'PlasticBreakError'
  }
}

// ошибка если принтер перегрелся
export class PrinterOverheatError extends PrintError {
  public constructor() {
    super('Перегрев принтера.', 'OVERHEAT')
    this.name = 'PrinterOverheatError'
  }
}

// ошибка если модель отклеилась от стола
export class AdhesionError extends PrintError {
  public constructor() {
    super('Модель отклеилась от основания.', 'ADHESION')
    this.name = 'AdhesionError'
  }
}

// ошибка для валидации ввода
export class ValidationError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
