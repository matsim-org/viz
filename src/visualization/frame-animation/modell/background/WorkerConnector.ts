import BackgroundWorker from './BackgroundWorker'
import { MethodCall, Message, TYPE_ERROR, TYPE_EVENT } from './Contracts'
type WorkerEventHandler = (name: string, data: any) => void

export default class WorkerConnector {
  private worker: Worker
  private workerEventDelegate: WorkerEventHandler
  private handleMessageDelegate: EventListener

  constructor(worker: Worker, callback: WorkerEventHandler) {
    this.worker = worker
    this.workerEventDelegate = callback
    this.handleMessageDelegate = e => this.handleWorkerMessage(e as MessageEvent)
    this.worker.addEventListener('message', this.handleMessageDelegate)
  }

  destroy() {
    if (this.worker) {
      this.worker.removeEventListener('message', this.handleMessageDelegate)
      this.worker.terminate()
    }
  }

  postWorkerMessage(methodName: string, data: any, transferrables: any[]) {
    if (this.worker) {
      let obj: MethodCall = {
        method: methodName,
        parameters: data,
      }
      this.worker.postMessage(obj, transferrables)
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    let then = Date.now()
    let message = e.data as Message

    switch (message.type) {
      case TYPE_ERROR:
        console.error('Error in Worker: ' + message.message)
        break
      case TYPE_EVENT:
        this.onWorkerEvent(message)
        break
      default:
        console.error('unknown message type: ' + message.type)
    }

    if (message.type === TYPE_EVENT) {
      let time = Date.now() - then
      console.log('Processing worker message: "' + message.name + '" took: ' + time + 'ms')
    }
  }

  private onWorkerEvent(message: Message) {
    if (this.workerEventDelegate) this.workerEventDelegate(message.name, message.message)
  }
}
