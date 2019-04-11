<template lang="pug">
.project
  summary-strip.summary-strip(
    :projectId="projectId"
    :projectStore="projectStore"
    :selectedRun="selectedRun"
    @onEdit="showSettings = true"
    @onAddVisualization="onAddVisualization"
    @onSelectModelRun="onSelectModelRun"
    @onDrop="onDrop"
    @onAddFiles="onAddFiles"
  )

  project-settings(v-if="showSettings" v-on:close="showSettings=false"
                  v-bind:projectStore="projectStore")

  .center-area
    .main-area
      section.images(v-if="imageFiles.length>0")
        .title {{selectedRun}} / Dashboard
        .viz-table
          .viz-item(v-for="image in imageFiles" :key="image.userFileName")
            image-file-thumbnail(:fileEntry="image" :fileApi="fileApi" :projectId="projectId")
            p.center {{image.userFileName}}

      section
        list-header(v-on:btnClicked="onAddVisualization" title="Visualizations" btnTitle="Add Viz")
        .visualizations
          .emptyMessage(v-if="project.visualizations && project.visualizations.length === 0")
            span No Visualizations yet. Add some!
          .viz-table(v-else)
            .viz-item(v-for="viz in project.visualizations"
                      @click="onSelectVisualization(viz)"
                      :key="viz.id")
                viz-thumbnail(@edit="onEditViz(viz)" @remove="onRemoveViz(viz)" @share="onShareViz(viz)")
                  .itemTitle(slot="title"): p {{ title(viz) }}
                  p(slot="content") {{ description(viz) }}

      section
        list-header(v-on:btnClicked="onAddFiles" title="Project Files" btnTitle="Add File")
        input.fileInput(type="file"
            id="fileInput"
            ref="fileInput"
            multiple
            v-on:change="onFileInput"
            )
        .file-area
          .files
            .emptyMessage(v-if="project.files && project.files.length === 0")
              span No files yet. Add some!
            .fileList(v-else)
              .fileItem(v-for="file in filesToShow")
                list-element( v-bind:key="file.id")
                  .itemTitle(slot="title")
                    span {{file.userFileName}}
                    span {{readableFileSize(file.sizeInBytes)}}

                  .tag-container(slot="content")
                    .tag.is-info(v-for="tag in file.tags")
                      span {{ tag.name }}
                  button.delete(slot="accessory" v-on:click="onDeleteFile(file.id)") Delete

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
                           @close="onAddVisualizationClosed"
                           :projectStore="projectStore"
                           :fileApi="fileApi"
                           :editVisualization="editVisualization")

      file-upload(v-if="showFileUpload"
                  @close="onAddFilesClosed"
                  :suggestedRun="selectedRun"
                  :uploadStore="uploadStore"
                  :projectStore="projectStore"
                  :selectedProject="project"
                  :selectedFiles="selectedFiles")

</template>

<script lang="ts">
import Vue from 'vue'
import mediumZoom from 'medium-zoom'

import CreateVisualization from '@/project/CreateVisualization.vue'
import FileUpload from '@/project/FileUpload.vue'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import Modal from '@/components/Modal.vue'
import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import FileAPI from '@/communication/FileAPI'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import ProjectStore from '@/project/ProjectStore'
import Component from 'vue-class-component'
import UploadStore from '@/project/UploadStore'
import { Visualization, FileEntry } from '@/entities/Entities'
import ProjectSettings from '@/project/ProjectSettings.vue'
import SummaryStrip from '@/project/SummaryStrip.vue'

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
    'image-file-thumbnail': ImageFileThumbnail,
    'summary-strip': SummaryStrip,
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
  private editVisualization?: Visualization
  private selectedFiles: File[] = []
  private selectedRun: string = ''

  private get isFetching() {
    return this.projectState.isFetching
  }

  private get project() {
    return this.projectState.selectedProject
  }

  private get modelRuns() {
    if (!this.project.tags) return []
    return this.project.tags
      .filter(a => a.type === 'run')
      .sort((a, b) => {
        // reverse sort! newest at top
        return a.name < b.name ? 1 : -1
      })
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

  public mounted() {}

  private get imageFiles() {
    if (!this.selectedRun) return []

    const imageTypePrefix = 'image/'
    const files = this.filesToShow.filter(f => f.contentType.startsWith(imageTypePrefix))
    files.sort((a, b) => {
      return a.userFileName > b.userFileName ? 1 : -1
    })
    return files
  }

  private get filesToShow() {
    if (!this.selectedRun) return this.project.files

    return this.project.files.filter(f => {
      for (const tag of f.tags) {
        if (tag.name === this.selectedRun) return true
      }
      return false
    })
  }

  private title(viz: Visualization) {
    if (!viz.parameters) return viz.type
    if (viz.parameters.Title) return viz.parameters.Title.value
    if (viz.parameters.Description) return viz.parameters.Description.value
    return viz.type // fallback
  }

  private description(viz: Visualization) {
    const fallback = '' + viz.type + ': ' + viz.id.substring(0, 6)
    if (!viz.parameters) return fallback
    if (!viz.parameters.Title) return fallback
    if (viz.parameters.Description) return viz.parameters.Description.value
    return fallback
  }

  private onAddVisualization() {
    this.editVisualization = undefined
    this.showCreateVisualization = true
  }

  private async onSelectModelRun(modelRun: any) {
    console.log('boop', modelRun)
    // toggle, if it's already selected
    if (this.selectedRun === modelRun.name) this.selectedRun = ''
    else this.selectedRun = modelRun.name

    // the medium zoom library does things to the DOM, so this Vue hack is required
    await Vue.nextTick()
    mediumZoom('.medium-zoom', { background: '#444450' })
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

  private async onDrop(files: any) {
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
  private async onRemoveViz(viz: Visualization) {
    try {
      this.projectStore.deleteVisualization(viz)
    } catch (error) {
      console.error(error)
    }
  }

  private async onEditViz(viz: Visualization) {
    console.log('About to EDIT')
    this.editVisualization = viz
    this.showCreateVisualization = true
  }

  private async onShareViz(viz: Visualization) {
    console.log('share viz not yet implemented')
  }
}
</script>

<style scoped>
.heroContainer {
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

section {
  margin: 2rem 1.5rem 2rem 1.5rem;
}

.project {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  background-color: #eee;
  height: 100vh;
}

.summary-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 16rem;
  height: 100vh;
  background-color: #242831;
  color: #eee;
  display: flex;
  flex-direction: column;
}

.center-area {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
}

.main-area {
  max-width: 60rem;
  margin: 0px auto;
  padding-top: 1rem;
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

.strip-empty-message {
  display: flex;
  flex-direction: row;
  margin-top: 0.2rem;
}

.viz-table {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, 240px);
  list-style: none;
  padding-left: 0px;
  margin-bottom: 0px;
  overflow-y: auto;
}

.viz-item {
  display: table-cell;
  padding: 0 0 0 0;
  vertical-align: top;
  width: 240px;
}

.drop {
  padding: 1rem 3rem;
  margin: 1rem 0rem 1.5rem 0rem;
  text-align: center;
  border: 0.2rem dashed #aaa;
  border-radius: 0.25rem;
  color: #aaa;
  font-size: 0.8rem;
}

.drop:hover {
  border: 0.2rem dashed #ffa;
  color: white;
}

.drop.over {
  border: 0.2rem dashed #097c43;
  background-color: black;
  margin: 1rem -0.2rem 1.5rem -0.2rem;
}

.file-area {
  display: grid;
  grid-template-columns: 1fr;
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

.title-band {
  background-color: #363a45;
  padding: 1.5rem 1rem 2rem 1rem;
  text-align: center;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
}

.title-band h3 {
  color: #eee;
}

.title-band h4 {
  color: #aaa;
}

.title-details {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  margin: auto 0rem;
}

.editButton {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  color: #888;
  margin: auto 0rem auto 0.1rem;
  border: solid 1px #888;
  padding: 0.1rem 0.3rem;
  border-radius: 0.3rem;
}

.editButton:hover,
active {
  color: #ffa;
  border: solid 1px #ffa;
  cursor: pointer;
}

.project-description {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  justify-content: center;
  padding: 1rem 0rem 0rem 0rem;
  color: #aaa;
}

.add-viz {
  padding: 2rem 1rem;
  text-align: center;
}

.add-files {
  padding-bottom: 1.2rem;
  text-align: center;
  width: 100%;
}

.accent {
  background-color: #097c43;
  width: 100%;
}

.accent:hover {
  background-color: #097733; /* #096c63; */
}

.summary-category {
  margin: 0rem 1rem 4rem 1rem;
}

.modelTab {
  margin-right: 0px;
}

.section-head {
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: #479ccc;
  font-size: 0.9rem;
}

.viz-summary {
  display: flex;
  flex-direction: column;
}

.modelRun {
  padding: 0.3rem 0rem 0.3rem 1.2rem;
  font-size: 0.9rem;
  border-radius: 1.3rem 0rem 0rem 1.3rem;
  color: #eee;
}

.modelRun:hover {
  background-color: #363a45;
  cursor: pointer;
}

.modelRun.selected {
  background-color: #eee;
  color: #223;
}

.dropzone {
  margin-top: auto;
  margin-bottom: 0rem;
}

.gettingStarted {
  padding: 1rem 1rem 1rem 0rem;
  font-size: 0.8rem;
  color: #ccc;
}

.project-name {
  font-size: 1.2rem;
}

.subtitle {
  color: #999;
  font-size: 0.85rem;
}

.images {
  margin-bottom: 3rem;
  background-color: white;
  padding: 1rem;
  border-radius: 3px;
  border: solid 1px #ccc;
}
.center {
  text-align: center;
  font-weight: bold;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
