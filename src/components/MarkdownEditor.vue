<template lang="pug">
#editor
  .content
    textarea(:value="editorContent" @input="update" v-if="isEditing")
    .preview(v-html="compiledMarkdown")
    hr(v-if="value")

  .actions
    button.button.is-gray.is-small(
      v-if="!isEditing"
      @click="clickedEdit") {{ value ? "Edit" : "Add Notes" }}
    button.button.is-link.is-small(v-if="isEditing" @click="clickedSave") Save
    button.button.is-small(v-if="isEditing" @click="clickedCancel") Cancel
</template>

<script lang="ts">
import marked from 'marked'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

const vueInstance = Vue.extend({
  props: { value: String },
  components: {},
  data() {
    return {
      editorContent: '',
      previous: '',
      isEditing: false,
    }
  },
})

@Component
export default class MarkdownEditor extends vueInstance {
  private created() {
    if (this.value) this.editorContent = this.value
  }

  private update(e: any) {
    this.editorContent = e.target.value
  }

  private clickedEdit(this: any) {
    this.previous = this.value
    if (!this.value) this.editorContent = '## Notes\n\nAdd notes to this page using **markdown text**.'
    else this.editorContent = this.value

    this.isEditing = !this.isEditing
  }

  private clickedCancel(this: any) {
    this.editorContent = ''
    this.isEditing = !this.isEditing
  }

  private clickedSave(this: any) {
    this.isEditing = !this.isEditing
    this.$emit('save', this.editorContent)
  }

  private get compiledMarkdown() {
    return marked(this.editorContent || this.value, { gfm: true })
  }
}
</script>

<style scoped>
#editor {
  color: #333;
  display: flex;
  flex-direction: row;
  height: 100%;
  padding-top: 1rem;
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
  font-size: 0.8rem;
  font-family: 'Monaco', courier, monospace;
  padding: 0.5rem;
  margin-bottom: 1rem;
  min-height: 20rem;
  border: 1px solid #4499cc;
}

.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 0.5rem;
}

code {
  color: #f66;
}

.preview {
  flex: 1;
}

.actions {
  display: flex;
  flex-direction: column;
  margin-left: 0.5rem;
}

.button {
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}
</style>
