<template lang="pug">
  transition(name="modal")
    .modal.is-active
      .modal-background(v-on:click="$emit('close-requested')")
      .modal-content
        header.modal-card-head
            slot(name="header")
        section.modal-card-body
            slot(name="content")
        footer.modal-card-foot
            slot(name="actions")
      .modal-close.is-large(aria-label="close")
</template>

<style scoped>
.modal-card-foot {
  flex-direction: row-reverse;
}

.modal-content {
  max-height: 90%;
  min-width: 45rem;
}

.modal-background {
  background-color: #000000b2;
}

.modal-card-head {
  background-color: #242831; /* 363a45; /* #097c43; */
  border-radius: 0px;
  padding: 1.5rem 3rem;
  border: solid 1px #777;
}

.modal-card-foot {
  border-radius: 0px;
  padding: 1.2rem 3rem;
}

.modal-card-body {
  padding: 2rem 3rem;
  overflow-y: auto;
}
</style>

<style>
/* WARNING! editing in global scope here, so that bulma picks up change. Be careful! */
.modal-card-head p {
  color: #479ccc;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.modal-card-content {
  padding: 0rem 2rem;
}
</style>


<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
</script>
