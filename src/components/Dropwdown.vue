<template lang="pug">
    .wrapper
        .dropdown
            .dropdown-trigger
                input.input(type="text"
                    @blur="isOpen = false"
                    @keyup.enter="select"
                    @keyup.tab="select"
                    @keydown.down="onDown"
                    @keydown..up="onUp"
                    @keyup.esc="isOpen = false"
                    v-model="search"
                )
                button.button.is-small(@click="toggle()")
                    span.icon.is-small
                        i.fas.fa-angle-down

            .dropdown-menu(id="dropwdown-menu" role="menu")
                .dropdown-content
                    .dropdown-item(v-for="item in filteredItems")
                        slot()
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

const vueInstance = Vue.extend({
  props: {
    options: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      options: this.$props.options as any[],
    }
  },
})

@Component
export default class Dropwdown extends vueInstance {
  private isOpen = false
  private search = ''

  private get filteredItems() {
    return this.$props.options.fileter((option: string) => option.toLowerCase().includes(this.search.toLowerCase()))
  }
  private toggle() {}
  private select() {}

  private onDown() {}

  private onUp() {}
}
</script>

<style scoped>
.dropdown-trigger {
  display: flex;
  flex-direction: row;
}
</style>


