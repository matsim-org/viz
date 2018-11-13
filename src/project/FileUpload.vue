<template lang="pug">
modal(v-on:close-requested="close()")
  span(slot="header")
    h3 Upload Files
  
  div(slot="content")
    aside.menu
      p Things to set up
    .main-content
      p here will be main content
    
  div(slot="actions")
    button.ui.negative.button(v-on:click="close()") Cancel
    


</template>

<script lang="ts">
import Vue from 'vue'
import Modal from '@/components/Modal.vue'

export default Vue.extend({
  components: {
    modal: Modal,
  },
  methods: {
    close: function(): void {
      this.$emit('close')
    },
  },
})
</script>