import { MethodCall, Message, INITIALIZE, TYPE_EVENT, TYPE_ERROR } from './Contracts'
/*  make sure typescript know that the global context is a worker context
    also see: https://github.com/Microsoft/TypeScript/issues/582
    and: https://github.com/Microsoft/TypeScript/issues/20595
*/
const workerContext: Worker = self as any

abstract class BackgroundWorker {
  private handleMessageDelegate: EventListener
  private isInitialized = false

  constructor() {
    this.handleMessageDelegate = (evt: Event) => this.handleMessage(evt as MessageEvent)
    addEventListener('message', this.handleMessageDelegate)
  }

  kill() {
    removeEventListener('message', this.handleMessageDelegate)
  }

  private handleMessage(e: MessageEvent) {
    let message = e.data as MethodCall
    if (!this.isValidMessage(message)) {
      this.error('invalid method call. method name and parameters are required')
      return
    }

    if (message.method === INITIALIZE) {
      this.handleInitialize(message)
      this.isInitialized = true
      return
    }

    if (!this.isInitialized) {
      this.error('Background worker is not initialized!')
      return
    }

    this.handleMethodCall(message)
  }

  abstract handleMethodCall(call: MethodCall): void
  abstract handleInitialize(call: MethodCall): void

  protected eventByReference(name: string, data: any, transferrables: any[]) {
    let objData: Message = {
      type: TYPE_EVENT,
      name: name,
      message: data,
    }

    workerContext.postMessage(objData, transferrables)
  }

  protected event(name: string, data: any) {
    workerContext.postMessage({ type: TYPE_EVENT, name: name, message: data })
  }

  protected error(errorMessage: string) {
    workerContext.postMessage({
      type: TYPE_ERROR,
      name: TYPE_ERROR,
      message: errorMessage,
    })
  }

  private isValidMessage(message?: MethodCall) {
    return message && message.method && message.parameters
  }
}

export default BackgroundWorker
