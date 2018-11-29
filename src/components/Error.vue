<template lang="pug">
  .error {{message}}
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: ['message'],
})
</script>

<style scoped>
.error {
  color: white;
  background-color: #ef5350;
  border-radius: 4px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  margin: 1rem 0 0 0;
}
</style>
