export default interface SimpleEvent<T> {
  addEventHandler(handler: (payload: T) => void): void
  removeEventHandler(handler: (payload: T) => void): void
}

export class SimpleEventEmmiter<T> implements SimpleEvent<T> {
  private handlers: Array<(payload: T) => void> = []

  public addEventHandler(handler: (payload: T) => void) {
    this.handlers.push(handler)
  }

  public removeEventHandler(handler: (payload: T) => void) {
    this.handlers = this.handlers.filter(h => h !== handler)
  }

  public emmit(payload: T) {
    this.handlers.slice(0).forEach(handler => handler(payload))
  }
}
