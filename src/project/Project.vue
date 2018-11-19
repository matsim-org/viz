<template lang="pug">
.project
  .hero.is-link
    .hero-body
      h1.title {{project.name}}
      h3.subtitle.small lorem ipsum &raquo; {{project.id}}

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
            viz-thumbnail
              .itemTitle(slot="title"): span {{ viz.type.typeName}}
              span(slot="content") lorem ipsum dolor et tu brute

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
            list-element( v-bind:key="file.id" v-on:itemClicked="onSelectFile(file.id)")
              .itemTitle(slot="title")
                span {{file.userFileName}}
                span {{readableFileSize(file.sizeInBytes)}}

              span(slot="content") {{file.id}}

              button.button.is-small.is-rounded.is-warning(slot="accessory" v-on:click="onDeleteFile(file.id)") Delete

    h3 Pending Uploads
      .uploads
        .fileItem(v-for="upload in uploads")
          list-element
            .itemTitle(slot="title")
              span {{ upload.file.name }}
              span {{ toPercentage(upload.progress) }}%
            span(slot="content") {{ toStatus(upload.status) }}       

  create-visualization(v-if="showCreateVisualization"
                        v-on:close="onAddVisualizationClosed"
                        v-bind:projectsStore="projectsStore")

  file-upload(v-if="showFileUpload" v-on:close="onAddFilesClosed"
  v-bind:uploadStore="uploadStore", v-bind:selectedProject="project")
</template>
<script lang="ts">
import Vue from 'vue'
import CreateVisualization from '@/project/CreateVisualization.vue'
import FileUpload from '@/project/FileUpload.vue'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import Modal from '@/components/Modal.vue'
import SharedStore, { SharedState } from '@/SharedStore'
import Project from '@/entities/Project'
import VizThumbnail from '@/components/VizThumbnail.vue'
import { Visualization } from '@/entities/Visualization'
import FileAPI from '@/communication/FileAPI'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import ProjectsStore from '@/project/ProjectsStore'
import Component from 'vue-class-component'
import UploadStore from '@/project/UploadStore'
import { stat } from 'fs'

interface ProjectState {
  sharedState: SharedState
  project: Project
  isFetchingData: boolean
  showCreateVisualization: boolean
  showFileUpload: boolean
  over: boolean
}

const vueInstance = Vue.extend({
  props: {
    projectsStore: ProjectsStore,
    uploadStore: UploadStore,
    projectId: String,
  },
  components: {
    'create-visualization': CreateVisualization,
    'file-upload': FileUpload,
    'list-header': ListHeader,
    'list-element': ListElement,
    'viz-thumbnail': VizThumbnail,
    Drag,
    Drop,
  },
  data() {
    return {
      projectsState: this.projectsStore.State,
      uploadState: this.uploadStore.State,
      sharedState: SharedStore.state,
    }
  },
})

@Component
export default class ProjectViewModel extends vueInstance {
  private showCreateVisualization = false
  private showFileUpload = false
  private isDragOver = false

  private get isFetching() {
    return this.projectsState.isFetching
  }

  private get project() {
    return this.projectsState.selectedProject
  }

  private get uploads() {
    return this.uploadState.uploads.filter(upload => upload.project.id === this.project.id)
  }

  private async created() {
    try {
      await this.projectsStore.selectProject(this.projectId)
    } catch (error) {
      console.error(error)
      // do some error handling
    }
  }

  private onAddVisualization() {
    this.showCreateVisualization = true
  }

  private onAddVisualizationClosed() {
    this.showCreateVisualization = false
  }

  private onAddFiles() {
    /* const input = this.$refs.fileInput as HTMLInputElement
    input.click()*/
    this.showFileUpload = true
  }

  private onAddFilesClosed() {
    this.showFileUpload = false
  }

  private async onFileInput() {
    const files = (this.$refs.fileInput as any).files
    try {
      await this.projectsStore.addFilesToSelectedProject(files)
    } catch (error) {
      console.error(error)
    }
  }

  private async onDrop(data: any, event: any) {
    event.preventDefault()
    this.isDragOver = false
    const files = event.dataTransfer.files

    try {
      await this.projectsStore.addFilesToSelectedProject(files)
    } catch (error) {
      console.error(error)
    }
  }

  private onSelectVisualization(viz: Visualization) {
    this.$router.push({ path: `/${viz.type}/${this.project.id}/${viz.id}` })
  }

  private async onSelectFile(fileId: string) {
    try {
      const blob = await FileAPI.downloadFile(fileId, this.project.id)
      window.open(URL.createObjectURL(blob))
    } catch (e) {
      console.log(e)
    }
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
}
</script>
<style scoped>
section {
  margin: 4rem 1.5rem 2rem 1.5rem;
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
  margin: 20px 10px 50px 0px;
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
</style>