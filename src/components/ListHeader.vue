<template lang="pug">
  .listHeader
    h1 {{title}}
    button.ui.animated.positive.button(v-on:click="$emit('btnClicked')")
      .ui.visible.content {{btnTitle}}
      .ui.hidden.content
        i.ui.plus.icon
</template>

<style scoped>
.listHeader {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid lightgray;
}

button.ui.green.button {
  margin-right: 0px;
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: ['title', 'btnTitle'],
  name: 'listHeader',
})
</script>
