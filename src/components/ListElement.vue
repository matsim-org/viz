<template lang="pug">
  .listItem
    .title
        slot(name="title")
    .content
        slot(name="content")
</template>

<style>
.listItem {
  display: flex;
  flex-direction: column;
  padding: 1rem 0 1rem 0;
  border-bottom: 1px solid lightgray;
}

.title {
  font-weight: bold;
}

.content {
  font-weight: lighter;
  color: gray;
}
</style>



