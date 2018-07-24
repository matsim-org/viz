export default class ErrorResponse {
  private static get ERROR(): string {
    return 'error'
  }

  private static get DESCRIPTION(): string {
    return 'error_description'
  }

  private _error: string = ''
  private _description: string = ''

  get error(): string {
    return this._error
  }

  get description(): string {
    return this._description
  }

  constructor(parameter: { [key: string]: string }) {
    if (parameter[ErrorResponse.ERROR]) this._error = parameter[ErrorResponse.ERROR]
    if (parameter[ErrorResponse.DESCRIPTION]) this._description = parameter[ErrorResponse.DESCRIPTION]
  }
}
