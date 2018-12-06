<template lang="pug">
#app
  .topnavrow
    router-link.nav-link(to="/"): img.nav-logo(src="@/assets/matsim-logo-white.png")

    .breadcrumb-row
      span(v-for="crumb in breadcrumbs" :key="crumb.title")
        p.nav-breadcrumb &bull;
          router-link.nav-breadcrumb.nav-bread-link(:to="crumb.link") {{ crumb.title }}

    .nav-rightside
      a.topnavrow-item(@click="onLogin()") {{ loginText }}
      router-link.topnavrow-item(to="/projects" v-if="isLoggedIn") Projects
      
  router-view.main-content
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import sharedStore, { EventBus } from '@/SharedStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import 'bulma/css/bulma.css'

interface BreadCrumb {
  title: string
  link: string
}

@Component
export default class App extends Vue {
  private breadcrumbs: BreadCrumb[] = []
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state

  private get sharedState() {
    return sharedStore.state
  }

  private get loginText() {
    return this.isLoggedIn ? 'Log Out' : 'Log In'
  }

  private get isLoggedIn() {
    return this.authState.status === AuthenticationStatus.Authenticated
  }

  public mounted() {
    EventBus.$on('set-breadcrumbs', (crumbs: BreadCrumb[]) => {
      this.breadcrumbs = crumbs
    })
  }

  private onLogin() {
    if (this.authState.status === AuthenticationStatus.Authenticated) {
      this.authStore.logOut()
      this.$router.push({ path: '/' })
    } else {
      this.$router.push({ path: '/authentication' })
    }
  }
}
</script>

<style>
html,
body {
  background-color: white;
  height: 100vh;
  min-height: 100vh;
  overflow-y: auto;
  font-family: 'Raleway', 'Open Sans', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Raleway', 'Open Sans', Helvetica, Arial, sans-serif;
  font-weight: 700;
  color: #363636;
}

#app {
  background-color: white;
  display: grid;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  max-height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

.main-content {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  z-index: 1;
}

.topnavrow {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 0.75rem 1.5rem 0.75rem 1.5rem;
  background-color: hsl(0, 0%, 29%);
  z-index: 5;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}

.topnavrow-item {
  color: #ccc;
  margin-left: 1rem;
}

.nav-link {
  display: flex;
}

.nav-logo {
  margin-right: 0.7rem;
  height: 26px;
}

.breadcrumb-row {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  display: flex;
  flex-direction: row;
}

.nav-breadcrumb {
  vertical-align: top;
  color: #ccc;
  margin-right: 0.25rem;
  margin-bottom: 0px;
  font-size: 1rem;
}

.nav-bread-link {
  margin-left: 0.5rem;
}
a:hover {
  color: #fff;
}

.nav-rightside {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
}
</style>
