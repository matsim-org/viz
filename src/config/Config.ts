interface Config {
  readonly authServer: string
  readonly fileServer: string
  readonly frameAnimationServer: string
  readonly clientId: string
  readonly authCallback: string
}

function createConfig(): Config {
  // it is necessary to provide defaults in case the app is build without a configuration e.g. under unit testing
  return {
    authServer: process.env.VUE_APP_AUTH_SERVER ? (process.env.VUE_APP_AUTH_SERVER as string) : 'https://some-auth.uri',
    fileServer: process.env.VUE_APP_FILE_SERVER ? (process.env.VUE_APP_FILE_SERVER as string) : 'https://some-file.uri',
    frameAnimationServer: process.env.VUE_APP_FRAME_ANIMATION_SERVER
      ? (process.env.VUE_APP_FRAME_ANIMATION_SERVER as string)
      : 'https://some-frame-animation.uri',
    clientId: process.env.VUE_APP_ID ? (process.env.VUE_APP_ID as string) : 'some-client-id',
    authCallback: process.env.VUE_APP_AUTH_CALLBACK
      ? (process.env.VUE_APP_AUTH_CALLBACK as string)
      : 'https://localhost:8080/authentication',
  }
}

export default createConfig()
