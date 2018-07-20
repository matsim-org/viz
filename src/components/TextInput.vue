<template lang="pug">
  .textInput
    label.inputLabel {{label}}
    .ui.input
        input(v-bind:value="text"
              v-bind:change="text"
              v-on:change="$emit('change', $event.target.value)"
              type="text")
</template>
<style scoped>
.textInput {
  display: flex;
  flex-direction: column;
  margin: 1rem 0 1rem 0;
}

.inputLabel {
  font-size: 0.85rem;
  color: rgb(138, 138, 138);
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  model: {
    prop: 'text',
    event: 'change',
  },
  props: {
    text: String,
    label: String,
  },
})
</script>
