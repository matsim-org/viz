<template lang="pug">
.authentication
    .requesting(v-if="isRequesting")
      spinner
      span {{message}}
    .authError(v-if="isFailed")
      span.errorMessage {{message}}
      button.button.is-link(v-on:click="onTryAgainClicked") Try again
</template>

<style scoped>
.authentication {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto auto;
}

.requesting {
  flex: 1;
}

.authError {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.errorMessage {
  margin-bottom: 1rem;
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import sharedStore, { SharedState } from '../SharedStore'
import { Route } from 'vue-router'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import SpinnerVue from '@/components/Spinner.vue'

@Component({
  components: {
    spinner: SpinnerVue,
  },
})
export default class Authentication extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state
  private sharedState = sharedStore.state

  private get message() {
    return this.computeMessage(this.authState.status)
  }

  private get isFailed() {
    return this.authState.status === AuthenticationStatus.Failed
  }

  private get isRequesting(): boolean {
    return this.authState.status === AuthenticationStatus.Requesting
  }

  private get isAuthenticated(): boolean {
    return this.authState.status === AuthenticationStatus.Authenticated
  }

  private get isNotAuthenticated(): boolean {
    return this.authState.status === AuthenticationStatus.NotAuthenticated
  }

  public created() {
    sharedStore.setFullPage(true)
    if (this.isRequesting) {
      this.handleAuthenticationResponse(this.$route, this.authStore)
    } else if (this.isNotAuthenticated) {
      this.authStore.requestAuthentication()
    }
  }

  public destroyed() {
    sharedStore.setFullPage(false)
  }

  public beforeMount() {
    if (this.isAuthenticated) {
      this.$router.replace(this.sharedState.lastNavigation)
    }
  }

  public updated() {
    if (this.isNotAuthenticated) {
      this.authStore.requestAuthentication()
    }
  }

  private onTryAgainClicked() {
    this.authStore.resetState()
  }

  private computeMessage(status: AuthenticationStatus) {
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

  private handleAuthenticationResponse(route: Route, authStore: AuthenticationStore): void {
    if (route.hash) {
      this.authStore.handleAuthenticationResponse(route.hash)
    } else if (route.query.error) {
      this.authStore.handleFailedAuthenticationResponse({
        error: 'request_failed',
        error_description: String(route.query.error),
      })
    } else {
      this.authStore.handleFailedAuthenticationResponse({
        error: 'request_incomplete',
        error_description: 'unknown reason',
      })
    }
  }
}
</script>
