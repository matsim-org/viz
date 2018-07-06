interface Config {
  readonly authServer: string
  readonly fileServer: string
  readonly clientId: string
}

function createConfig(): Config {
  if (process.env.USE_LOCAL_API) {
    return {
      authServer: 'https://localhost:3000',
      fileServer: 'https://localhost:3010',
      clientId: 'test-client-id',
    }
  } else {
    return {
      authServer: 'https://cnode00.vsp.tu-berlin.de:3000',
      fileServer: 'https://cnode00.vsp.tu-berlin.de:3001',
      clientId: 'matsim-viz-local-client-id',
    }
  }
}

export default createConfig()
