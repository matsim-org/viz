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

.modal-card-head {
  align-content: stretch;
  align-items: stretch;
}

.modal-card-body {
  flex: 1;
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
</script>
