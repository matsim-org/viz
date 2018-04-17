<template lang="pug">
  .listHeader
    h1 {{title}}
    button.ui.green.button(v-on:click="$emit('btnClicked')") {{btnTitle}}
</template>

<style>
.listHeader {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid lightgray;
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: ['title', 'btnTitle'],
  name: 'listHeader',
})
</script>

