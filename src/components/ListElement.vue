<template lang="pug">
  .listItem
    button.clickContent(v-on:click="$emit('itemClicked')")
      .title
        slot(name="title")
      .main
        slot(name="content")
    .accessory
      slot(name="accessory")

</template>

<style>
.listItem {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
</style>




