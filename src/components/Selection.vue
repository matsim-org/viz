<template lang="pug">
  select.select(v-on:change="handleChanged()" v-model="selected")
    option.option(v-for="option in options")
      slot(v-bind:option="option")
        
    
</template>

<script lang="ts">
import Vue from 'vue'

interface SelectionState {
  selected: any
}
export default Vue.extend({
  props: {
    options: Array,
  },
  data() {
    return {
      selected: '',
    }
  },
  model: {
    prop: 'selected',
    event: 'change',
  },
  methods: {
    handleChanged: function() {
      this.$emit('selection-changed', this.$data.selected)
    },
  },
})
</script>

<style scoped>
.select {
  min-width: 10em;
  border: 1px solid rgba(34, 36, 38, 0.15);
  color: #2c3e50;
  border-radius: 2px;
}

.option {
  border-bottom: 1px solid rgba(34, 36, 38, 0.15);
  margin: 1rem;
}
</style>


