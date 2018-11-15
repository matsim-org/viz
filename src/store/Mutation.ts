export default abstract class Mutation<T> {
  private payload: T

  public get Payload() {
    return this.payload
  }

  constructor(payload: T) {
    this.payload = payload
  }
}
