<template lang="pug">
#component
  ul
    li.item(v-for="(item, index) in appState.searchResults"
            :key="item.url"
            @click="clickedItem(item)"
            :class="{'is-project': item.collection==='Project'}")
      .stripe(:class="{'is-project': item.collection==='Project'}")
      .details(:class="{'is-active-item': index === activeItem}")
        label.label: b {{ item.title }}
        p.subcontent {{item.subtitle || '&nbsp;'}}
        p.suburl {{item.url}}

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import SharedStore from '@/SharedStore'
import { setTimeout } from 'timers'

@Component
export default class SearchResults extends Vue {
  private appState = SharedStore.state // so vue pays attention
  private activeItem = -1

  private clickedItem(item: any) {
    console.log({ item })
    this.$router.push({ path: item.url })
  }

  private created() {
    window.addEventListener('keyup', this.onKeyPressed)
    window.addEventListener('click', this.onWindowClicked)
  }

  private destroyed() {
    window.removeEventListener('keyup', this.onKeyPressed)
    window.removeEventListener('click', this.onWindowClicked)
  }

  private onKeyPressed(e: any) {
    if (e.keyCode === 13) {
      // ENTER

      // if there's only one result, use it
      if (this.activeItem === -1 && this.appState.searchResults.length === 1) this.activeItem = 0

      // activate it!
      if (this.activeItem > -1) this.clickedItem(this.appState.searchResults[this.activeItem])
    }

    if (e.keyCode === 27) {
      // ESC
      SharedStore.setSearchResults([])
    }

    // UP
    if (e.keyCode === 38) {
      this.activeItem = this.mod(this.activeItem - 1, this.appState.searchResults.length)
      console.log(this.activeItem)
    }

    // DOWN
    if (e.keyCode === 40) {
      this.activeItem = this.mod(this.activeItem + 1, this.appState.searchResults.length)
      console.log(this.activeItem)
    }
  }

  // js modulo % is broken
  // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
  private mod(n: number, m: number) {
    return ((n % m) + m) % m
  }

  private onWindowClicked(e: any) {
    setTimeout(() => {
      SharedStore.setSearchResults([])
    }, 250)
  }
}
</script>

<style scoped>
#component {
  padding: 0rem 0rem;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #5980ad;
  border-right: 1px solid #5980ad;
  border-left: 1px solid #5980ad;
  animation: 0.2s ease 0s 1 slideInFromTop;
  overflow-y: auto;
}

.item {
  display: flex;
  flex-direction: row;
}

.item:hover {
  background-color: #ddeedd;
  cursor: pointer;
}

.item.is-project:hover {
  background-color: #dde;
}

.stripe {
  width: 0.75rem;
  background-color: #679b67;
}

.stripe.is-project {
  background-color: #896caf;
}

.details {
  padding: 0.22rem 1rem;
  width: 100%;
  border-bottom: 1px solid #ddd;
}

.label {
  margin-bottom: 0px;
}

.subcontent {
  font-size: 0.8rem;
  line-height: 1rem;
}

.suburl {
  font-size: 0.7rem;
  color: #778;
  text-align: right;
}

.is-active-item {
  background-color: #dde;
}

@keyframes slideInFromTop {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutToTop {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
}

@media only screen and (max-width: 640px) {
}
</style>
