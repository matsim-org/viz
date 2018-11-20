<template lang="pug">
modal(v-on:close-requested="close()")
  .header(slot="header")
    h3 Upload Files
    .addFiles
        button.button.is-primary(v-on:click="onAddFiles()") Select Files
        input.fileInput(type="file"
          id="fileInput"
          ref="fileInput"
          multiple
          v-on:change="onFileInput"
          )
    
  .content(slot="content")
    .tagWrapper
      .tags
        .selectedTags
          .tag.is-info(v-for="tag in selectedTags")
            span {{ tag.name }}
            button.delete.is-small(@click="onRemoveTag(tag)")
        .dropdown(:class="{'is-active': showTags && filteredTags.length > 0}")
          .dropdown-trigger 
            button.button.is-small(@click="showTags = !showTags")
              span Add more tags
              span.icon.is-small
                i.fas.fa-angle-down
          .dropdown-menu(role="menu")
            .dropdown-content
              a.dropdown-item(v-for="tag in filteredTags" @click="onTagSelected(tag)") {{ tag.name }}
      .addNewTag
        input.input(type="text" v-model="newTagText")
        button.button(@click="onAddTag") Add
      
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
import TagsInput from '@johmun/vue-tags-input'
import Modal from '@/components/Modal.vue'
import ListElement from '@/components/ListElement.vue'
import UploadStore, { FileUpload, UploadStatus } from '@/project/UploadStore'
import Project, { Tag } from '@/entities/Project'
import Component from 'vue-class-component'
import ProjectsStore from '@/project/ProjectsStore'

const vueInstance = Vue.extend({
  components: {
    modal: Modal,
    'list-element': ListElement,
    'tags-input': TagsInput,
  },
  props: {
    projectStore: ProjectsStore,
    uploadStore: UploadStore,
    selectedProject: Object,
  },
})

@Component
export default class FileUploadViewModel extends vueInstance {
  private newTagText: string = ''
  private showTags: boolean = false
  private tag: string = ''
  private selectedUploads: FileUpload[] = []
  private selectedTags: Tag[] = []
  private tagFilter = ''

  private get filteredTags() {
    return this.selectedProject.tags.filter((tag: Tag) => !this.selectedTags.includes(tag))
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

  private onTagSelected(tag: Tag) {
    this.selectedTags.push(tag)
  }

  private onRemoveTag(tag: Tag) {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id)
  }

  private async onAddTag() {
    const exsistingTag = this.selectedProject.tags.find((tag: Tag) => tag.name === this.newTagText)
    if (!exsistingTag && this.newTagText !== '') {
      await this.projectStore.addTagToSelectedProject(this.newTagText, 'run')
    }
  }

  private onRemoveFile(upload: FileUpload) {
    this.selectedUploads = this.selectedUploads.filter(u => u !== upload)
  }

  private async uploadFiles() {
    this.selectedUploads.forEach(upload => {
      upload.tags = this.selectedTags
    })
    this.uploadStore.uploadFiles(this.selectedUploads)
    this.close()
  }
}
</script>



<style scoped>
.tags {
  display: flex;
  flex-direction: row;
}

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
  justify-content: space-between;
  width: 100%;
}

.content {
  min-height: 300px;
}

.tagWrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.addNewTag {
  display: flex;
  flex-direction: row;
}

.tag {
  margin-right: 0.3rem;
}

.hover-link:hover {
  background-color: lightgray;
  cursor: pointer;
}
</style>