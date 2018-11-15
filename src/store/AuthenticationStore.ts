import Mutation from './Mutation'
import Store from './Store'

export interface AuthenticationState {
  authTest: string
}

export interface AuthPayload {
  payloadTest: string
}

export class AuthenticationMutation extends Mutation<AuthPayload> {}

class AuthenticationStore extends Store<AuthenticationState> {
  public handleMutation<P>(mutation: Mutation<P>): void {
    if (mutation instanceof AuthenticationMutation) {
      this.State.authTest = mutation.Payload.payloadTest
    }
  }

  protected getInitialState() {
    return {
      authTest: 'testytest',
    }
  }
}

export default new AuthenticationStore()
