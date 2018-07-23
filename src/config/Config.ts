interface Config {
  readonly authServer: string
  readonly fileServer: string
  readonly clientId: string
}

function createConfig(): Config {
  return {
    authServer: process.env.VUE_APP_AUTH_SERVER as string,
    fileServer: process.env.VUE_APP_FILE_SERVER as string,
    clientId: process.env.VUE_APP_ID as string,
  }
}

export default createConfig()
