import { Dispatcher } from './Dispatcher'
import Mutation from './Mutation'

type Action = (dispatcher: Dispatcher) => Promise<void>
export default Action
