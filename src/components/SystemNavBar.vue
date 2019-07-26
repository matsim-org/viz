<template lang="pug">
#systembar
    .matsim-logo-panel
      img.matsim-logo(src='/matsim-logo-white.png' @click="onClick('/')")

    .nav-item(v-for="item in leftItems" :key="item.id" @click="onClick(item.url)")
      .icon-label {{ item.label }}

    .gap

    .nav-item(@click="onLogin()")
      .icon-label {{ loginText }}
    .nav-item.loginout(@click="showFirebaseAuth()")
      .icon-label Account
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import ProjectStore from '@/project/ProjectStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import SharedStore from '@/SharedStore'

@Component
export default class SystemNavBar extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  private sharedStore = SharedStore

  private get leftItems() {
    return SharedStore.state.breadCrumbs
  }

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
  background-color: #5980ad;
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
  font-size: 0.8rem;
  font-weight: normal;
}

.matsim-logo-panel {
  margin: auto 0rem;
}

.matsim-logo {
  height: 1.75rem;
  margin-top: 0.3rem;
}

.matsim-logo:hover {
  cursor: pointer;
}

@media only screen and (max-width: 640px) {
  #systembar {
    margin: 0px 0px;
    padding: 0rem 1rem 0px;
  }
}
</style>


