<template lang="pug">
  span Callback...
</template>

<script lang="ts">
import Vue from 'vue'
import { BigStore } from '../shared-store'
import { Route } from 'vue-router'

export default Vue.extend({
  name: 'Callback',
  props: ['auth'],
  beforeRouteEnter(to: Route, from: Route, next: Function) {
    if (to.hash) {
      BigStore.handleAuthenticationResponse(to.hash)
    } else if (to.params) {
      BigStore.handleFailedAuthenticationResponse(to.params)
    }
    next('/personal')
  },
})
</script>
