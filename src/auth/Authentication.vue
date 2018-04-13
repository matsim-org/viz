<template lang="pug">
  span bal
</template>

<script lang="ts">
import Vue from 'vue'
import sharedStore, { SharedState } from '../SharedStore'
import { AuthenticationState } from '../auth/Auth'
import { Route } from 'vue-router'

interface ComponentState {
  sharedState: SharedState
  message: string
}

export default Vue.extend({
  name: 'Authentication',
  data(): ComponentState {
    return {
      sharedState: sharedStore.state,
      message: '',
    }
  },
  created() {
    if (this.sharedState.authentication === AuthenticationState.Requesting) {
      this.message = 'processing authentication...'
      handleAuthenticationResponse(this.$route)
    } else if (this.sharedState.authentication === AuthenticationState.Failed) {
      this.message = 'failed authentication'
    } else if (
      this.sharedState.authentication === AuthenticationState.Authenticated
    ) {
      this.message = 'authenticated!'
      this.$router.push('/personal')
    } else {
      this.message = 'requesting authentication...'
      sharedStore.authenticate()
    }
  },
})

function handleAuthenticationResponse(route: Route): void {
  if (route.hash) {
    sharedStore.handleAuthenticationResponse(route.hash)
  } else if (route.params.error) {
    sharedStore.handleFailedAuthenticationResponse(route.params)
  }
}
</script>
