<template lang="pug">
  div.authentication
    div.ui.active.text.loader(v-if="isRequesting") {{message}}
    div.error(v-if="isFailed")
      span.errorMessage {{message}}
      button.ui.green.button(v-on:click="handleTryAgainClicked") Try again
</template>

<style>
.authentication {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.errorMessage {
  margin-bottom: 1rem;
}
</style>

<script lang="ts">
import Vue from 'vue'
import sharedStore, { SharedState } from '../SharedStore'
import authenticationStore, { AuthenticationStatus, AuthenticationState } from '../auth/Authentication'
import { Route } from 'vue-router'

interface ComponentState {
  sharedState: SharedState
  authState: AuthenticationState
}

export default Vue.extend({
  name: 'Authentication',
  data(): ComponentState {
    return {
      sharedState: sharedStore.state,
      authState: authenticationStore.state,
    }
  },
  computed: {
    message: function(): string {
      return getMessage(this.authState.status)
    },
    isFailed(): boolean {
      return this.authState.status === AuthenticationStatus.Failed
    },
    isRequesting(): boolean {
      return this.authState.status === AuthenticationStatus.Requesting
    },
    isAuthenticated(): boolean {
      return this.authState.status === AuthenticationStatus.Authenticated
    },
    isNotAuthenticated(): boolean {
      return this.authState.status === AuthenticationStatus.NotAuthenticated
    },
  },
  methods: {
    handleTryAgainClicked: () => {
      authenticationStore.resetState()
    },
  },
  created() {
    if (this.isRequesting) {
      handleAuthenticationResponse(this.$route)
    } else if (this.isNotAuthenticated) {
      authenticationStore.requestAuthentication()
    }
  },
  beforeMount() {
    if (this.isAuthenticated) {
      this.$router.replace(this.sharedState.lastNavigation)
    }
  },
  updated() {
    if (this.isNotAuthenticated) {
      authenticationStore.requestAuthentication()
    }
  },
})

function getMessage(status: AuthenticationStatus) {
  switch (status) {
    case AuthenticationStatus.NotAuthenticated:
      return 'Not authenticated'
    case AuthenticationStatus.Requesting:
      return 'Requesting authentication'
    case AuthenticationStatus.Failed:
      return 'Error! could not authenticate'
    default:
      return 'unknown state'
  }
}

function handleAuthenticationResponse(route: Route): void {
  if (route.hash) {
    authenticationStore.handleAuthenticationResponse(route.hash)
  } else if (route.query.error) {
    authenticationStore.handleFailedAuthenticationResponse(route.query)
  } else {
    authenticationStore.handleFailedAuthenticationResponse({
      error: 'request_incomplete',
      error_description: 'unknown reason',
    })
  }
}
</script>
