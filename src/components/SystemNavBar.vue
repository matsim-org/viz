<template lang="pug">
#systembar
    .matsim-logo-panel
      img.matsim-logo(src='@/assets/matsim-logo-white.png' @click="onClick('/')")

    .center-area
      .row1(v-if="centerItems.length>0") {{ centerItems[0].label }}
      .row2(v-if="centerItems.length>1")
        .bbreadcrumb(v-for="crumb in subtitles") {{ crumb.label }}
          // router-link(v-if="crumb.url" :to="crumb.url") {{ crumb.label }}
          // span(v-else) {{ crumb.label }}

    .nav-item(@click="toggleLogin()")
      .icon-label {{ loginText }}
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

  private get centerItems() {
    return SharedStore.state.breadCrumbs
  }

  public async mounted() {}

  private get loginText() {
    return this.isLoggedIn ? 'Log Out' : 'Log In'
  }

  private get subtitles() {
    const crumbs: any = SharedStore.state.breadCrumbs
    if (crumbs.length < 1) return []

    // add cute bullets between subtitle elements
    const elements = crumbs.slice(1)
    const result = elements.flatMap((value: any, index: any, array: any) =>
      array.length - 1 !== index ? [value, { label: ' \u2022 ' }] : value
    )

    return result
  }

  private get isLoggedIn() {
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  private toggleLogin() {
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
  padding: 0rem 0rem 0rem 1rem;
  margin: auto 0px auto auto;
  text-align: center;
  color: #e8e8e8;
}

.nav-item:hover {
  color: #fdfd91;
  cursor: pointer;
}

.center-area {
  display: flex;
  flex-direction: column;
  margin: auto 1rem auto 2rem;
}

.row1 {
  color: white;
  font-weight: bold;
  margin-top: -0.1rem;
}

.row2 {
  display: flex;
  flex-direction: row;
}

.bbreadcrumb {
  font-size: 0.75rem;
  color: white;
  margin: 0rem 0.5rem 0rem 0rem;
}

.icon-label {
  font-size: 0.8rem;
  font-weight: normal;
}

.matsim-logo-panel {
  display: flex;
  flex-direction: column;
  margin: auto 0rem;
  vertical-align: center;
}

.matsim-logo {
  flex: 1;
  height: 2.1rem;
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


