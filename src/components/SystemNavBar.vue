<template lang="pug">
#systembar
    .matsim-logo-panel
      img.matsim-logo(src='@/assets/matsim-logo-white.png' @click="onClick('/')")

    .center-area
      .row1(v-if="centerItems.length>0"): p {{ centerItems[0].label }}
      .row2(v-if="centerItems.length>1")
        .bbreadcrumb(v-for="crumb in subtitles") {{ crumb.label }}
          // router-link(v-if="crumb.url" :to="crumb.url") {{ crumb.label }}
          // span(v-else) {{ crumb.label }}

    .right-area
      .search-area(v-if="!sharedStore.state.isFullPageMap")
        .field
          p.control.has-icons-left
            input.input.is-link.searchbox(v-model="searchText" type="text" placeholder="Search or jump to...")
            span.icon.is-small.is-left
              i.fas.fa-search

      button.button.is-small.log-button(
        @click="toggleLogin()"
        :class="{'is-light': !isLoggedIn, 'is-outlined': !isLoggedIn, 'is-link': isLoggedIn, 'is-inverted': isLoggedIn}"
        v-if="!sharedStore.state.isFullPageMap") {{ loginText }}
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import debounce from 'debounce'

import ProjectStore from '@/project/ProjectStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import SharedStore from '@/SharedStore'
import FireBaseAPI from '../communication/FireBaseAPI'

@Component
export default class SystemNavBar extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private sharedStore = SharedStore
  private searchText = ''

  private debounceStartSearch = debounce(this.startSearch, 250)

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

  private async startSearch(searchTerm: string) {
    const results = await FireBaseAPI.searchForText(searchTerm)
    SharedStore.setSearchResults(results)
  }

  @Watch('$route')
  private routeChanged() {
    this.searchText = ''
  }

  @Watch('searchText')
  private searchBoxTextChanged() {
    if (!this.searchText) {
      this.sharedStore.setSearchResults([])
      return
    }

    this.debounceStartSearch(this.searchText)
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

.log-button {
  margin: auto 0;
  padding: 0.95rem 0.75rem;
}

.center-area {
  display: flex;
  flex-direction: column;
  margin: auto 0px auto 2rem;
  flex: 1;
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
  height: 2.1rem;
}

.matsim-logo:hover {
  cursor: pointer;
}

.right-area {
  width: 22rem;
  display: flex;
  flex-direction: row;
  margin-left: auto;
  margin-right: 0px;
}

.search-area {
  margin: auto 2rem auto 0rem;
  width: 100%;
}

.searchbox {
  background-color: #546d96;
  font-size: 0.9rem;
  padding: 1rem 1rem;
}

.searchbox:focus {
  background-color: #eee;
}

.searchbox::placeholder {
  color: rgba(226, 226, 241, 0.7);
}

.searchbox:focus::placeholder {
  color: rgba(57, 57, 82, 0.7);
}

@media only screen and (max-width: 640px) {
  #systembar {
    margin: 0px 0px;
    padding: 0rem 1rem 0px;
  }

  .search-area {
    display: none;
  }

  .center-area {
    margin: auto auto;
  }

  .matsim-logo {
    height: 1.25rem;
  }

  .row1 {
    margin-left: 0.25rem;
    font-size: 0.8rem;
    text-align: center;
  }

  .row2 {
    display: none;
  }
}
</style>


