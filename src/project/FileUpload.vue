<template lang="pug">
modal(v-on:close-requested="close()")
  span(slot="header")
    h3 Upload Files
  
  div(slot="content")
    .header
      button.button.is-primary(v-on:click="onAddFiles()") Select Files
      input.fileInput(type="file"
        id="fileInput"
        ref="fileInput"
        multiple
        v-on:change="onFileInput"
        )
    .fileList
      .fileItem(v-for="file in selectedFiles")
        list-element(v-bind:key="file.name")
          .itemTitle(slot="title")
            span {{ file.name }}
            span {{ file.type }}
          span(slot="content") {{ file.size }}
          button.delete.is-medium(slot="accessory" v-on:click="onRemoveFile(file)")
    
  div(slot="actions")
    button.ui.negative.button(v-on:click="cancel()") Cancel
    button.button.is-link(v-on:click="uploadFiles()") Upload
    


</template>

<script lang="ts">
import Vue from 'vue'
import Modal from '@/components/Modal.vue'
import ListElement from '@/components/ListElement.vue'
import UploadStore, { FileUpload, UploadStatus } from '@/project/UploadStore'
import Project from '@/entities/Project'
import Component from 'vue-class-component'

const vueInstance = Vue.extend({
  components: {
    modal: Modal,
    'list-element': ListElement,
  },
  props: {
    uploadStore: UploadStore,
    selectedProject: Object,
  },
})

@Component
export default class FileUploadViewModel extends vueInstance {
  private selectedFiles: File[] = []

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }

  private onAddFiles() {
    const input = this.$refs.fileInput as HTMLInputElement
    input.click()
  }

  private onFileInput() {
    const files = (this.$refs.fileInput as any).files as Iterable<File>
    for (const file of files) {
      this.selectedFiles.push(file)
    }
  }

  private onRemoveFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file)
  }

  private async uploadFiles() {
    const uploads: FileUpload[] = this.selectedFiles.map(file => {
      return {
        project: this.selectedProject,
        file: file,
        tags: [],
        status: UploadStatus.NotStarted,
        progress: 0,
      }
    })
    this.uploadStore.uploadFiles(uploads)
    this.close()
  }
}
</script>

<style scoped>
.fileInput {
  display: none;
}

.itemTitle {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>