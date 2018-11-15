import Mutation from './Mutation'
import Action from './Action'
import Store from './Store'

export class Dispatcher {
  private stores: Array<Store<any>> = []
  private isCommiting: boolean = false

  constructor() {}

  public register(store: Store<any>) {
    this.stores.push(store)
  }

  public commit<P>(mutation: Mutation<P>) {
    if (this.isCommiting) {
      throw new Error('Don`t commit mutations from handleMutations method')
    }
    try {
      this.isCommiting = true
      this.stores.forEach(store => store.handleMutation(mutation))
    } finally {
      this.isCommiting = false
    }
  }

  public async dispatch(action: Action): Promise<void> {
    await action(this)
  }
}

export default new Dispatcher()
