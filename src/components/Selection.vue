<template lang="pug">
  .select
    label.selectLabel {{ label }}
    select.ui.input.selectInput(v-on:change="handleChanged('changed', $event)" v-model="selected")
      option.option(v-for="option in options" v-bind:value="option")
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
    label: String,
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
    handleChanged: function(value: any, event: Event) {
      const select = event.target as HTMLSelectElement
      const selectedElement = this.$props.options[select.selectedIndex]

      this.$emit('selection-changed', selectedElement)
    },
  },
})
</script>

<style scoped>
.select {
  display: flex;
  flex-direction: column;
}

.selectLabel {
  font-size: 0.85rem;
  color: rgb(138, 138, 138);
}

.selectInput {
  width: 100%;
  border: 1px solid rgba(34, 36, 38, 0.15);
  color: #2c3e50;
  border-radius: 2px;
  padding: 9.5px 14px;
}

.option {
  border-bottom: 1px solid rgba(34, 36, 38, 0.15);
  margin: 1rem;
}
</style>


