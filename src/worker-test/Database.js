import Worker from './Worker.worker'

export default class Database {
  constructor() {
    this.worker = new Worker()
    this.worker.postMessage({ message: 'created' })
  }

  post() {
    this.worker.postMessage({ message: 'posted' })
  }
}
