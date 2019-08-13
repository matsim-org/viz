<template lang="pug">
#editor
  .content
    textarea(:value="input" @input="update" v-if="isEditing")
    .preview(v-html="compiledMarkdown")
    .actions
      button.button.is-link.is-small.is-outlined(v-if="!isEditing" @click="clickedEdit") Edit
      button.button.is-link.is-small(v-if="isEditing") Save
      button.button.is-small(v-if="isEditing" @click="isEditing = !isEditing") Cancel
</template>

<script lang="ts">
import marked from 'marked'
import _ from 'lodash'
import Vue from 'vue'

export default Vue.extend({
  data: () => {
    return {
      input: '# Hello',
      previous: '',
      isEditing: false,
    }
  },
  methods: {
    update: _.debounce(function(this: any, e) {
      this.input = e.target.value
    }, 300),
    clickedEdit: () => {
      this.isEditing = !isEditing
    },
  },

  computed: {
    compiledMarkdown: function() {
      return marked(this.input, { gfm: true })
    },
  },
})
</script>

<style scoped>
#editor {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
  display: flex;
  flex-direction: column;
}

textarea,
#editor div {
  vertical-align: top;
}

textarea {
  flex: 1;
  border: none;
  border-right: 1px solid #ccc;
  resize: none;
  outline: none;
  background-color: #f6f6f6;
  font-size: 14px;
  font-family: 'Monaco', courier, monospace;
  padding: 20px;
}

.content {
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 0.5rem;
}

code {
  color: #f66;
}

.preview {
  flex: 1;
  padding: 0.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
  margin-right: auto;
}

.button {
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}
</style>
