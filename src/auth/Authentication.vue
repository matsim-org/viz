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
import authentication, { AuthenticationState } from '../auth/Authentication'
import { Route } from 'vue-router'

interface ComponentState {
  sharedState: SharedState
}

export default Vue.extend({
  name: 'Authentication',
  data(): ComponentState {
    return {
      sharedState: sharedStore.state,
    }
  },
  computed: {
    message: getMessage,
    isFailed(): boolean {
      return this.sharedState.authentication === AuthenticationState.Failed
    },
    isRequesting(): boolean {
      return this.sharedState.authentication === AuthenticationState.Requesting
    },
    isAuthenticated(): boolean {
      return (
        this.sharedState.authentication === AuthenticationState.Authenticated
      )
    },
    isNotAuthenticated(): boolean {
      return (
        this.sharedState.authentication === AuthenticationState.NotAuthenticated
      )
    },
  },
  methods: {
    handleTryAgainClicked: () => {
      sharedStore.resetAuthenticationState()
    },
  },
  created() {
    if (this.isRequesting) {
      handleAuthenticationResponse(this.$route)
    } else if (this.isNotAuthenticated) {
      sharedStore.authenticate()
    }
  },
  beforeMount() {
    if (this.isAuthenticated) {
      this.$router.replace(this.sharedState.navigateToOnAuthentication)
    }
  },
  updated() {
    if (this.isNotAuthenticated) {
      sharedStore.authenticate()
    }
  },
})

function getMessage() {
  switch (sharedStore.state.authentication) {
    case AuthenticationState.NotAuthenticated:
      return 'Not authenticated'
    case AuthenticationState.Requesting:
      return 'Requesting authentication'
    case AuthenticationState.Failed:
      return 'Error! could not authenticate'
    default:
      return 'unknown state'
  }
}

function handleAuthenticationResponse(route: Route): void {
  if (route.hash) {
    sharedStore.handleAuthenticationResponse(route.hash)
  } else if (route.query.error) {
    sharedStore.handleFailedAuthenticationResponse(route.query)
  }
}
</script>
