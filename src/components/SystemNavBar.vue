<template lang="pug">
#systembar
    .matsim-logo-panel
      img.matsim-logo(src='/matsim-logo-white.png' @click="onClick('/')")

    .nav-item(v-for="item in topItems" :key="item.id" @click="onClick(item.url)")
      i.fa.fa-lg(:class="item.icon" aria-hidden="true")
      .icon-label {{ item.id }}

    .gap

    .nav-item(v-for="item in bottomItems" :key="item.id" @click="onClick(item.url)")
      .icon-label {{ item.id }}
    .nav-item(@click="onLogin()")
      .icon-label {{ loginText }}
    .nav-item.loginout(@click="showFirebaseAuth()")
      .icon-label Account
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import ProjectStore from '@/project/ProjectStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

@Component
export default class SystemNavBar extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  private topItems = [
    // { id: 'Home', icon: 'fa-home', url: '/' },
    // { id: 'Map', icon: 'fa-map', url: '/' },
    // { id: 'Run Log', icon: 'fa-database', url: '/' },
  ]
  private bottomItems = [] // [{ id: 'Settings', icon: 'fa-cog', url: '/' }]

  public async mounted() {}

  private get loginText() {
    return this.isLoggedIn ? 'Log Out' : 'Log In'
  }

  private get isLoggedIn() {
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  private onLogin() {
    if (this.authStore.state.status === AuthenticationStatus.Authenticated) {
      this.authStore.logOut()
      this.$router.push({ path: '/' })
    } else {
      this.$router.push({ path: '/authentication' })
    }
  }

  private showFirebaseAuth() {
    this.$router.push({ path: '/account' })
  }

  private onClick(url: string) {
    this.$router.push({ path: url })
  }
}
</script>

<style scoped>
#systembar {
  background-color: #479ccc;
  display: flex;
  flex-direction: row;
  margin: 0px 0px;
  padding: 0px 2rem 0px 2rem;
}

.nav-item {
  padding: 0rem 0.5rem;
  margin: auto 0px;
  text-align: center;
  color: #e8e8e8;
}

.nav-item:hover {
  color: #fdfd91;
  cursor: pointer;
}

.gap {
  margin: 0 auto;
}

.icon-label {
  font-size: 0.7rem;
  font-weight: bold;
}

.matsim-logo-panel {
  margin: auto 0rem;
}

.matsim-logo {
  float: left;
  height: 1.8rem;
  margin: 0.75rem 0rem;
}

.matsim-logo:hover {
  cursor: pointer;
}
</style>


