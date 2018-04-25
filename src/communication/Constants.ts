export class HeaderKeys {
  static get CONTENT_TYPE(): string {
    return 'content-type'
  }
  static get AUTHORIZATION(): string {
    return 'authorization'
  }
}

export class ContentType {
  static get APPLICATION_JSON(): string {
    return 'application/json'
  }
  static get APPLICATION_OCTET_STREAM(): string {
    return 'application/octet-stream'
  }
  static get TEXT_PLAIN(): string {
    return 'text/plain'
  }
}

export class Method {
  static get GET(): string {
    return 'GET'
  }

  static get POST(): string {
    return 'POST'
  }

  static get PUT(): string {
    return 'PUT'
  }
}
