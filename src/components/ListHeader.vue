<template lang="pug">
  .listHeader
    h3.title.is-3 {{title}}
    a.button.is-rounded.is-link(v-on:click="$emit('btnClicked')") {{btnTitle}}
</template>

<style scoped>
.listHeader {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
