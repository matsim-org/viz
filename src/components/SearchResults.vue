<template lang="pug">
#component
  ul
    li.item(v-for="item in appState.searchResults" @click="clickedItem(item)")
      p: b {{ item.title }}
      p {{item.subtitle || '&nbsp;'}}

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import sharedStore from '@/SharedStore'

@Component
export default class SearchResults extends Vue {
  private appState = sharedStore.state // so vue pays attention

  private clickedItem(item: any) {
    console.log({ item })
    this.$router.push({ path: item.url })
  }
}
</script>

<style scoped>
#component {
  padding: 0rem 0rem;
  background-color: white;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #66f;
  border-right: 1px solid #66f;
  border-left: 1px solid #66f;
  animation: 0.3s ease 0s 1 slideInFromTop;
}

.item {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}

.item:hover {
  background-color: #eef;
  cursor: pointer;
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
