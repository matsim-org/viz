<template lang="pug">
  span Project page for Project {{projectId}}
</template>

<style>

</style>

<script lang="ts">
import Vue from 'vue'
import SharedStore from '../SharedStore'
export default Vue.extend({
  data() {
    return {
      sharedState: SharedStore.state,
    }
  },
  computed: {
    projectId: function(): string {
      return this.$route.params.id
    },
  },
})
</script>


