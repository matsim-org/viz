<template lang="pug">
.project
  .hero.is-link
    .heroContainer
      .projectTitle
        h1.title(slot="content") {{project.name}}
        h3.subtitle viz-{{project.id}}
      .editButton
        button.button.is-small(@click="showSettings = true") 
                span.icon.is-small
                    i.fas.fa-pen

  section
    list-header(v-on:btnClicked="onAddVisualization" title="Visualizations" btnTitle="Add Viz")
    span(v-if="isFetching") Fetching project data...
    .visualizations
      .emptyMessage(v-if="project.visualizations && project.visualizations.length === 0")
        span No Visualizations yet. Add some!
      .viz-table(v-else)
        .viz-item(v-for="viz in project.visualizations"
                  v-on:click="onSelectVisualization(viz)"
                  v-bind:key="viz.id")
            viz-thumbnail(@remove="onRemoveViz(viz.id)" @share="handleShareViz(viz.id)")
              .itemTitle(slot="title"): span {{ viz.type }}
              span(slot="content") viz-{{ viz.id.substring(0,4) }}

  section
    list-header(v-on:btnClicked="onAddFiles" title="Project Files" btnTitle="Add File")
    input.fileInput(type="file"
        id="fileInput"
        ref="fileInput"
        multiple
        v-on:change="onFileInput"
        )
    .file-area
      drop.drop(
        :class="{isDragOver}"
        @dragover="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop="onDrop"
        effect-allowed='all'
      ): b Drag/drop files here!

      .files
        .emptyMessage(v-if="project.files && project.files.length === 0")
          b No files yet. Add some!
        .fileList(v-else)
          .fileItem(v-for="file in project.files")
            list-element( v-bind:key="file.id")
              .itemTitle(slot="title")
                span {{file.userFileName}}
                span {{readableFileSize(file.sizeInBytes)}}

              .tag-container(slot="content")
                .tag.is-info(v-for="tag in file.tags")
                  span {{ tag.name }}

              button.delete.is-medium(slot="accessory" v-on:click="onDeleteFile(file.id)") Delete

    
  section.uploads(v-if="uploads.length > 0")
    .upload-header
      h3.title.is-3 Pending Uploads
    .fileItem(v-for="upload in uploads")
      list-element
        .itemTitle(slot="title")
          span {{ upload.file.name }}
          span {{ toPercentage(upload.progress) }}%
        span(slot="content") {{ toStatus(upload.status) }}

  create-visualization(v-if="showCreateVisualization"
                        v-on:close="onAddVisualizationClosed"
                        v-bind:projectStore="projectStore"
                        v-bind:fileApi="fileApi")

  file-upload(v-if="showFileUpload" v-on:close="onAddFilesClosed"
              v-bind:uploadStore="uploadStore"
              v-bind:projectStore="projectStore"
              v-bind:selectedProject="project"
              v-bind:selectedFiles="selectedFiles")
  
  project-settings(v-if="showSettings" v-on:close="showSettings=false"
                  v-bind:projectStore="projectStore")


</template>
<script lang="ts">
import Vue from 'vue'
import CreateVisualization from '@/project/CreateVisualization.vue'
import FileUpload from '@/project/FileUpload.vue'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import Modal from '@/components/Modal.vue'
import SharedStore, { EventBus, SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import FileAPI from '@/communication/FileAPI'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import ProjectStore from '@/project/ProjectStore'
import Component from 'vue-class-component'
import UploadStore from '@/project/UploadStore'
import { Visualization } from '@/entities/Entities'
import ProjectSettings from '@/project/ProjectSettings.vue'

const vueInstance = Vue.extend({
  props: {
    projectStore: ProjectStore,
    uploadStore: UploadStore,
    projectId: String,
    fileApi: FileAPI,
  },
  components: {
    'create-visualization': CreateVisualization,
    'file-upload': FileUpload,
    'list-header': ListHeader,
    'list-element': ListElement,
    'viz-thumbnail': VizThumbnail,
    'project-settings': ProjectSettings,
    Drag,
    Drop,
  },
  data() {
    return {
      projectState: this.projectStore.State,
      uploadState: this.uploadStore.State,
      sharedState: SharedStore.state,
    }
  },
})

@Component
export default class ProjectViewModel extends vueInstance {
  private showCreateVisualization = false
  private showFileUpload = false
  private showSettings = false
  private isDragOver = false
  private selectedFiles: File[] = []

  private get isFetching() {
    return this.projectState.isFetching
  }

  private get project() {
    return this.projectState.selectedProject
  }

  private get uploads() {
    return this.uploadState.uploads.filter(upload => upload.project.id === this.project.id)
  }

  public async created() {
    try {
      await this.projectStore.selectProject(this.projectId)
    } catch (error) {
      console.error(error)
      // do some error handling
    }
  }

  public mounted() {
    EventBus.$emit('set-breadcrumbs', [
      { title: 'My Projects', link: '/projects' },
      { title: this.project.name, link: '/project/' + this.project.id },
    ])
  }

  private onAddVisualization() {
    this.showCreateVisualization = true
  }

  private onAddVisualizationClosed() {
    this.showCreateVisualization = false
  }

  private onAddFiles() {
    const input = this.$refs.fileInput as HTMLInputElement
    input.click()
  }

  private onAddFilesClosed() {
    this.showFileUpload = false
  }

  private async onFileInput() {
    const files = (this.$refs.fileInput as any).files
    this.selectedFiles = files
    this.showFileUpload = true
  }

  private async onDrop(data: any, event: any) {
    event.preventDefault()
    this.isDragOver = false
    const files = event.dataTransfer.files
    this.selectedFiles = files
    this.showFileUpload = true
  }

  private async onNameChanged(name: string, event: any) {
    try {
      await this.projectStore.changeNameOfSelectedProject(name)
    } catch (error) {
      console.log(error)
    }
  }

  private async onDeleteFile(fileId: string) {
    try {
      await this.projectStore.deleteFile(fileId)
    } catch (error) {
      console.log(error)
    }
  }

  private onSelectVisualization(viz: Visualization) {
    this.$router.push({ path: `/${viz.type}/${this.project.id}/${viz.id}` })
  }

  private readableFileSize(bytes: number): string {
    return filesize(bytes)
  }

  private toPercentage(fraction: number): string | undefined {
    return (fraction * 100).toFixed(0)
  }

  private toStatus(status: number): string {
    switch (status) {
      case 0:
        return 'Waiting'
      case 1:
        return 'Uploading'
      case 2:
        return 'Finished'
      default:
        return 'Failed'
    }
  }
  private async onRemoveViz(viz: string) {
    console.log('remove viz', viz)
    try {
      // const updatedProject = await FileAPI.deleteVisualization(viz)
      // this.project = updatedProject
    } catch (error) {
      console.error(error)
    }
  }
}
</script>
<style scoped>
.heroContainer {
  padding: 3rem 1rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
section {
  margin: 2rem 1.5rem 2rem 1.5rem;
}

.project {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.headline {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.fileInput {
  display: none;
}

.itemTitle {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.fileList {
  display: flex;
  flex-direction: column;
  align-content: stretch;
}

.fileItem {
  flex: 1;
  background-color: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
  margin: 0;
  text-align: inherit;
  font-size: inherit;
  cursor: pointer;
  transition-duration: 0.2s;
}

.tag-container {
  margin-top: 0.1rem;
}

.tag {
  margin-right: 0.3rem;
}

.fileItem:hover {
  background-color: #f0f0f0;
}

.emptyMessage {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 3rem;
}

.viz-table {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, 240px);
  list-style: none;
  padding-left: 0px;
  margin-bottom: 0px;
}

.viz-item {
  display: table-cell;
  padding: 0 0 0 0;
  vertical-align: top;
  width: 240px;
}

.viz-item:hover {
  cursor: pointer;
}
.drop {
  padding: 25px;
  margin: 20px 10px auto 0px;
  text-align: center;
  border: 5px dashed #ddd;
  border-radius: 10px;
}

.drop:hover {
  border: 5px dashed pink;
}

.drop.over {
  border: 5px dashed blue;
  background-color: #ccc;
}

.file-area {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
}

.files {
  margin-left: 10px;
}

.upload-header {
  border-bottom: 1px solid lightgray;
  width: 100%;
  padding-bottom: 1.5rem;
}
</style>