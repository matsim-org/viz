<template lang="pug">
modal(v-on:close-requested="close()")
  span(slot="header")
    .header
      h3 Upload Files
      .addFiles
          button.button.is-primary(v-on:click="onAddFiles()") Select Files
          input.fileInput(type="file"
            id="fileInput"
            ref="fileInput"
            multiple
            v-on:change="onFileInput"
            )
    
  div(slot="content")
    .header
      .tags
        .tag.is-primary(v-for="tag in selectedTags") {{ tag }}
        .dropdown.is-active
          .dropdown-trigger
            input.input(type="text" v-model="tagFilter")
          .dropdown-menu
            .dropdown-content
              .dropdown-item.hover-link(v-for="tag in filteredTags" @click="onSelectTag(tag)") {{ tag }}
              hr.dropdown-divider
              .dropdown-item.hover-link
                span(@click="onAddTag()") Add Tag...
      
    .fileList
      .fileItem(v-for="upload in selectedUploads")
        list-element(v-bind:key="upload.file.name")
          .itemTitle(slot="title")
            span {{ upload.file.name }}
            span {{ upload.file.type }}
          span(slot="content") {{ upload.file.size }}
          button.delete.is-medium(slot="accessory" v-on:click="onRemoveFile(upload)")
    
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
  private selectedUploads: FileUpload[] = []
  private sampleTags = ['Run001', 'run002', 'run003', 'nemo', 'Janek']
  private selectedTags: string[] = []
  private tagFilter = ''

  private get filteredTags() {
    if (!this.tagFilter) return this.sampleTags
    else return this.sampleTags.filter(tag => tag.toLowerCase().includes(this.tagFilter.toLowerCase()))
  }

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
      this.selectedUploads.push({
        project: this.selectedProject,
        file: file,
        tags: [],
        status: UploadStatus.NotStarted,
        progress: 0,
      })
    }
  }

  private onSelectTag(name: string) {
    this.selectedTags.push(name)
  }

  private onAddTag() {
    if (!this.tagFilter) return
    this.selectedTags.push(this.tagFilter)
    this.tagFilter = ''
  }

  private onRemoveFile(upload: FileUpload) {
    this.selectedUploads = this.selectedUploads.filter(u => u !== upload)
  }

  private async uploadFiles() {
    this.uploadStore.uploadFiles(this.selectedUploads)
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

.header {
  display: flex;
  flex-direction: row;
  min-height: 200px;
}

.hover-link:hover {
  background-color: lightgray;
  cursor: pointer;
}
</style>