<template lang="pug">
.card
  .card-image
  .card-actions
    a(title="Edit..." @click.stop="$emit('edit')")
      i.fas.fa-edit
    // a(title="Share..." @click.stop="$emit('share')")
    //   i.fas.fa-share
    a(title="Remove" @click.stop="$emit('remove')")
      i.fas.fa-times
  .card-content
    .card-title
      slot(name="title")
    .card-subtitle
      slot(name="content")
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
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

.title {
  font-weight: bold;
}

.main {
  font-weight: lighter;
  color: gray;
}

.accessory {
  display: flex;
  align-items: center;
}

.card .card-image {
  overflow: hidden;
  grid-column: 1/2;
  grid-row: 1/2;
  z-index: 3;
}

.card .card-image:hover {
  z-index: 1;
}

.card:hover {
  box-shadow: 0 2px 7px 0 rgba(0, 0, 0, 0.5);
  -webkit-box-shadow: 4 2px 7px 0 rgba(0, 0, 0, 0.5);
  -moz-box-shadow: 4 2px 7px 0 rgba(0, 0, 0, 0.5);
}

.card {
  display: grid;
  margin: 20px 20px 20px 0px;
  grid-template-columns: auto;
  grid-template-rows: auto auto;
  -webkit-box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
  -moz-box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 4 2px 5px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
}

.card .card-content {
  padding: 10px;
}

.card .card-content:hover {
  cursor: pointer;
}

.card .card-content .card-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.card .card-content .card-subtitle {
  display: block;
  font-size: 13px;
}

.card .card-actions {
  background-color: #aaaa99;
  margin: 6px 3px auto auto;
  padding: 2px;
  border-radius: 4px;
  grid-column: 1/2;
  grid-row: 1/2;
  z-index: 2;
}

.card .card-actions:hover {
  z-index: 10;
  text-decoration: none;
}

.card .card-actions a {
  font-size: 1rem;
  color: green;
  text-transform: uppercase;
  padding: 2px 6px;
}

.card .card-actions a:hover {
  color: #cc2222;
  background-color: #ffffff99;
  z-index: 4;
}

.card-image {
  background-color: #aaaa99;
  height: 2.5rem;
}
</style>
