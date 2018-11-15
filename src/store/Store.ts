import Mutation from './Mutation'
import Dispatcher from './Dispatcher'

export default abstract class Store<T> {
  private state: T
  constructor() {
    Dispatcher.register(this)
    this.state = this.getInitialState()
  }

  public get State(): T {
    return this.state
  }

  public abstract handleMutation<P>(mutation: Mutation<P>): void

  public resetState() {
    this.state = this.getInitialState()
  }

  protected abstract getInitialState(): T
}
