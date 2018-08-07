interface Config {
  readonly authServer: string
  readonly fileServer: string
  readonly frameAnimationServer: string
  readonly clientId: string
  readonly authCallback: string
}

function createConfig(): Config {
  return {
    authServer: process.env.VUE_APP_AUTH_SERVER as string,
    fileServer: process.env.VUE_APP_FILE_SERVER as string,
    frameAnimationServer: process.env.VUE_APP_FRAME_ANIMATION_SERVER as string,
    clientId: process.env.VUE_APP_ID as string,
    authCallback: process.env.VUE_APP_AUTH_CALLBACK as string,
  }
}

export default createConfig()
