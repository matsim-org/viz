<template lang="pug">
  .listItem
    button.clickContent(v-on:click="$emit('itemClicked')")
      .title.is-6
        slot(name="title")
      .subtitle.is-6
        slot(name="content")
    .accessory
      slot(name="accessory")
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'listElement',
})
</script>

<style scoped>
.listItem {
  display: flex;
  flex-direction: row;
  padding: 0rem 0.25rem 0rem 0.25rem;
  border-bottom: 1px solid lightgray;
}

.listItem:hover {
  background-color: rgb(240, 240, 240);
}

.clickContent {
  flex: 1;
  background-color: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
  margin: 0;
  text-align: inherit;
  font-size: inherit;
  cursor: pointer;
  padding: 1rem 1rem 1rem 0;
  transition-duration: 0.25s;
}

.xtitle {
  font-weight: bold;
}

.xmain {
  font-weight: lighter;
  color: gray;
}

.accessory {
  display: flex;
  align-items: center;
}
</style>
