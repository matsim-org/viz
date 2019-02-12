<template lang="pug">
#systembar
  .nav-item(v-for="item in topItems" :key="item.id")
    i.fa.fa-2x(:class="item.icon" aria-hidden="true")
    .icon-label {{ item.id }}

  .gap: span &nbsp;

  .nav-item(v-for="item in bottomItems" :key="item.id")
    i.fa.fa-2x(:class="item.icon" aria-hidden="true")
    .icon-label {{ item.id }}

</template>

<script lang="ts">
/*
    router-link.nav-link(to="/"): img.nav-logo(src="@/assets/matsim-logo-white.png")

    .breadcrumb-row
      p.nav-breadcrumb(v-for="crumb in breadcrumbs" :key="crumb.title") &bull;
        router-link.nav-breadcrumb.nav-bread-link(:to="crumb.link") {{ crumb.title }}

    .nav-rightside
      a.topnavrow-item(@click="onLogin()") {{ loginText }}
*/

import { Vue, Component, Prop } from 'vue-property-decorator'
import ProjectStore from '@/project/ProjectStore'

@Component
export default class SystemLeftBar extends Vue {
  public topItems = [
    { id: 'Home', icon: 'fa-home' },
    { id: 'Map', icon: 'fa-map' },
    { id: 'Run Log', icon: 'fa-database' },
  ]
  public bottomItems = [
    { id: 'Settings', icon: 'fa-cog' },
    { id: 'Log In', icon: 'fa-sign-in-alt' },
    { id: 'Log Out', icon: 'fa-sign-out-alt' },
  ]

  public async created() {}
}
</script>

<style scoped>
#systembar {
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 1.5rem 0rem;
  text-align: center;
  color: white;
}

.gap {
  margin: auto 0;
}

.icon-label {
  text-transform: uppercase;
  margin-top: 0.25rem;
}
</style>


