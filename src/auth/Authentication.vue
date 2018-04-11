<template lang="pug">
  span authenticating...
</template>

<script lang="ts">
import Vue from 'vue'
import sharedStore from '../SharedStore'
import { Route } from 'vue-router'
import router from '../router'

export default Vue.extend({
  name: 'Authentication',
  props: ['auth'],
  beforeRouteEnter(to: Route, from: Route, next: Function) {
    if (to.hash) {
      sharedStore.handleAuthenticationResponse(to.hash)
    } else if (to.params.error) {
      sharedStore.handleFailedAuthenticationResponse(to.params)
    }
    console.log(router)

    next()
  },
  data() {
    return {
      isLoading: false,
    }
  },
  created() {
    this.authenticate()
  },
  methods: {
    authenticate(): void {
      this.isLoading = true
      sharedStore.authenticate()
    },
  },
})
</script>
