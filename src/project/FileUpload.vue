<template lang="pug">
modal(v-on:close-requested="close()")
  .header(slot="header")
    h4.title.is-4 Upload files

  .tagsAndselectedFiles(slot="content")
    .cuteBlueHeading
      h1 Assign a model run ID:
      input.input.is-medium(type="text" v-model="modelRun", placeHolder="run-001")

    .cuteBlueHeading: h1 Choose additional tags:

    .selectedTags
      .tag.is-info(v-for="tag in selectedTags")
        span {{ tag.name }}
        button.delete.is-small(@click="onRemoveTag(tag)")

    .tagWrapper
      .tagsAndDropdown
        .dropdown(:class="{'is-active': showTags && filteredTags.length > 0}")
          .dropdown-trigger
            button.button.is-medium.is-rounded(@click="showTags = !showTags")
              span Add existing tags
              span.icon.is-small
                i.fas.fa-angle-down
          .dropdown-menu(role="menu")
            .dropdown-content
              a.dropdown-item(v-for="tag in filteredTags" @click="onTagSelected(tag)") {{ tag.name }}
      .addNewTag
        input.input.is-medium(type="text" v-model="newTagText" :class="{'is-danger': isInvalidNewTag }")
        button.button.is-medium.is-rounded.left-space(@click="onAddTag") New Tag

    .fileList
      h1 The following {{files.length}} file{{ files.length > 1 ? 's' : ''}} will be uploaded:
      .scrollableFileList
        .fileItem(v-for="file in files")
          list-element(v-bind:key="file.name")
            .itemTitle(slot="title")
              span {{ file.name }}
              span {{ file.type }}
            span(slot="content") {{ niceFilesize(file.size) }}
            button.delete.is-medium(slot="accessory" v-on:click="onRemoveFile(file)")

  div(slot="actions")
    button.negative.button.is-medium.is-rounded(v-on:click="cancel()") Cancel
    button.button.is-link.is-medium.is-rounded.accent(v-on:click="uploadselectedFiles()") Upload



</template>

<script lang="ts">
import filesize from 'filesize'

import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '@/components/Modal.vue'
import ListElement from '@/components/ListElement.vue'
import UploadStore, { FileUpload, UploadStatus } from '@/project/UploadStore'
import ProjectStore from '@/project/ProjectStore'
import { Tag, Project } from '@/entities/Entities'

@Component({
  components: {
    modal: Modal,
    'list-element': ListElement,
  },
})
export default class FileUploadViewModel extends Vue {
  private newTagText: string = ''
  private showTags: boolean = false
  private tag: string = ''
  private selectedTags: Tag[] = []
  private tagFilter = ''
  private isInvalidNewTag = false
  private files: File[] = []
  private modelRun: string = ''

  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore
  @Prop({ type: UploadStore, required: true })
  private uploadStore!: UploadStore
  @Prop({ type: Object as () => Project, required: true })
  private selectedProject!: Project
  @Prop({ type: FileList, required: true })
  private selectedFiles!: FileList

  private get filteredTags() {
    return this.selectedProject.tags
      .sort((a, b) => {
        return a.name > b.name ? 1 : -1
      })
      .filter((tag: Tag) => !this.selectedTags.includes(tag))
  }

  public created() {
    // tslint:disable-next-line
    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.files.push(this.selectedFiles[i])
    }
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }

  private niceFilesize(bytes: number) {
    return filesize(bytes)
  }
  private onTagSelected(tag: Tag) {
    this.selectedTags.push(tag)
  }

  private onRemoveTag(tag: Tag) {
    this.selectedTags = this.selectedTags.filter(t => t.id !== tag.id)
  }

  private async onAddTag() {
    const existingTag = this.selectedProject.tags.find(
      (tag: Tag) => tag.name.toLowerCase() === this.newTagText.toLowerCase()
    )
    if (!existingTag && this.newTagText !== '') {
      this.isInvalidNewTag = false
      await this.projectStore.addTagToSelectedProject(this.newTagText, 'run')

      // the normal case: user wants to use the tag they just added.
      const newTag = this.selectedProject.tags.find(
        (tag: Tag) => tag.name.toLowerCase() === this.newTagText.toLowerCase()
      )
      if (newTag) this.onTagSelected(newTag)

      this.newTagText = ''
    } else {
      this.isInvalidNewTag = true
    }
  }

  private onRemoveFile(file: File) {
    this.files = this.files.filter((f: File) => f !== file)
  }

  private async createModelRunTag() {
    if (this.modelRun.length === 0) return

    const existingTag = this.selectedProject.tags.find(
      (tag: Tag) => tag.name.toLowerCase() === this.modelRun.toLowerCase()
    )

    if (!existingTag) {
      await this.projectStore.addTagToSelectedProject(this.modelRun, 'run')
    }

    const newTag = this.selectedProject.tags.find((tag: Tag) => tag.name.toLowerCase() === this.modelRun.toLowerCase())
    if (newTag) this.onTagSelected(newTag)
  }

  private async uploadselectedFiles() {
    if (this.modelRun) await this.createModelRunTag()

    const uploads = this.files.map(file => {
      return {
        project: this.selectedProject,
        file: file,
        tags: this.selectedTags,
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
.tagsAndDropdown {
  display: flex;
  flex-direction: row;
  align-content: center;
  margin-bottom: 2rem;
}

.tagsAndselectedFiles {
  min-height: 25rem;
}

.fileInput {
  display: none;
}

.cuteBlueHeading {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: row;
}

.cuteBlueHeading h1 {
  font-size: 1.4rem;
  color: #479ccc;
  min-width: max-content;
  margin-right: 3rem;
  margin-top: 0.5rem;
}

.fileList h1 {
  font-size: 1.4rem;
  color: #479ccc;
  min-width: max-content;
  margin-right: 3rem;
  margin-top: 0.5rem;
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

h4 {
  color: #479ccc;
  text-transform: uppercase;
}

.accent {
  margin-left: 1rem;
  background-color: #2d76a1;
}

.accent:hover {
  background-color: #256083;
}

.input {
  width: 12rem;
}

.left-space {
  margin-left: 0.5rem;
}

.selectedTags {
  margin-bottom: 0.5rem;
}

.scrollableFileList {
  max-height: 20rem;
  overflow-y: auto;
}
</style>