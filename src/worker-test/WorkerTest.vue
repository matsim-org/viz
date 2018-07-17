<template lang="pug">
    div
        h1 Worker test
        span {{message}}
</template>

<script lang="ts">
import Vue from 'vue'
import Database from './Database'
export default Vue.extend({
  data() {
    return {
      message: 'test-message',
      database: new Database(),
    }
  },
  created: function() {
    this.database.post()
  },
})
</script>

