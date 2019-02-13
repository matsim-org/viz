<template lang="pug">
modal(v-on:close-requested="close()")
  .header(slot="header")
    h4.title.is-4 Upload selected files

  .tagsAndselectedFiles(slot="content")
    .tagWrapper
      .tagsAndDropdown
        .selectedTags
          .tag.is-info(v-for="tag in selectedTags")
            span {{ tag.name }}
            button.delete.is-small(@click="onRemoveTag(tag)")
        .dropdown(:class="{'is-active': showTags && filteredTags.length > 0}")
          .dropdown-trigger
            button.button.is-small(@click="showTags = !showTags")
              span Add tags
              span.icon.is-small
                i.fas.fa-angle-down
          .dropdown-menu(role="menu")
            .dropdown-content
              a.dropdown-item(v-for="tag in filteredTags" @click="onTagSelected(tag)") {{ tag.name }}
      .addNewTag
        input.input.is-small(type="text" v-model="newTagText" :class="{'is-danger': isInvalidNewTag }")
        button.button.is-small(@click="onAddTag") Add

    .fileList
      .fileItem(v-for="file in files")
        list-element(v-bind:key="file.name")
          .itemTitle(slot="title")
            span {{ file.name }}
            span {{ file.type }}
          span(slot="content") {{ file.size }}
          button.delete.is-medium(slot="accessory" v-on:click="onRemoveFile(file)")

  div(slot="actions")
    button.ui.negative.button(v-on:click="cancel()") Cancel
    button.button.is-link(v-on:click="uploadselectedFiles()") Upload



</template>

<script lang="ts">
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

  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore
  @Prop({ type: UploadStore, required: true })
  private uploadStore!: UploadStore
  @Prop({ type: Object as () => Project, required: true })
  private selectedProject!: Project
  @Prop({ type: FileList, required: true })
  private selectedFiles!: FileList

  private get filteredTags() {
    return this.selectedProject.tags.filter((tag: Tag) => !this.selectedTags.includes(tag))
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
      this.newTagText = ''
    } else {
      this.isInvalidNewTag = true
    }
  }

  private onRemoveFile(file: File) {
    this.files = this.files.filter((f: File) => f !== file)
  }

  private async uploadselectedFiles() {
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
}

.tagsAndselectedFiles {
  min-height: 25rem;
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