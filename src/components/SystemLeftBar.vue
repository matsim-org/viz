<template lang="pug">
#systembar
  .nav-item(v-for="item in topItems" :key="item.id")
    i.fa.fa-2x(:class="item.icon" aria-hidden="true")
    .icon-label {{ item.id }}

  .gap: span &nbsp;

  .nav-item(v-for="item in bottomItems" :key="item.id")
    i.fa.fa-2x(:class="item.icon" aria-hidden="true")
    .icon-label {{ item.id }}

  .nav-item(@click="onLogin()")
    i.fa.fa-2x(:class="isloggedIn ? 'fa-sign-out-alt' : 'fa-sign-in-alt'" aria-hidden="true")
    .icon-label {{ loginText }}
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import ProjectStore from '@/project/ProjectStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

@Component
export default class SystemLeftBar extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  private topItems = [
    { id: 'Home', icon: 'fa-home' },
    { id: 'Map', icon: 'fa-map' },
    { id: 'Run Log', icon: 'fa-database' },
    { id: 'Settings', icon: 'fa-cog' },
  ]
  private bottomItems = []

  public async created() {}

  private get loginText() {
    return this.isLoggedIn ? 'Log Out' : 'Log In'
  }

  private get isLoggedIn() {
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  public mounted() {}

  private onLogin() {
    if (this.authStore.state.status === AuthenticationStatus.Authenticated) {
      this.authStore.logOut()
      this.$router.push({ path: '/' })
    } else {
      this.$router.push({ path: '/authentication' })
    }
  }
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
  color: #e8e8e8;
  border-left: 0.3rem solid #479ccc;
  border-right: 0.3rem solid #479ccc;
}

.nav-item:hover {
  color: #ffa;
  border-left: 0.3rem solid #ffa;
}

.gap {
  margin: auto 0;
}

.icon-label {
  text-transform: uppercase;
  margin-top: 0.25rem;
  font-size: 1rem;
}
</style>


