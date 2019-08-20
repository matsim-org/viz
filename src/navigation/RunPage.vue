<template lang="pug">
#page
  .got404(v-if="got404")
    .title-strip
      p {{owner}} / {{urlslug}} / {{run}}
      h3.title.is-3 404 Not Found

  .stuff(v-else)
    .title-strip
      p
        router-link(:to='`/${owner}`') {{owner}}
        router-link(:to='`/${owner}/${urlslug}`') &nbsp;/ {{urlslug}}
        | &nbsp;/ {{ run }}

      h4.title.is-3(v-if="myProject.title") {{myProject.title}} &bullet; {{run}}
      h4.title.is-3(v-else) &nbsp;

    .content-area
      p.tagline: i {{ myRun.description ? myRun.description : "&nbsp;" }}

      markdown-editor.readme(v-model="myRun.notes" @save="saveNotes")

      h5.title.is-5 VISUALIZATIONS

      .viz-table
        .viz-item(v-for="viz in myVisualizations" @click="onSelectVisualization(viz)" :key="viz.id")
          viz-thumbnail(:viz="viz"
                        :showActionButtons="true"
                        @edit="onEditViz(viz)"
                        @remove="onRemoveViz(viz)"
                        @share="onShareViz(viz)")
        button.button.is-link.is-outlined.new-viz-button(
            @click="onAddVisualization") + New

      hr

      h5.title.is-5 FILES
        button.button.is-rounded.is-danger.is-outlined(
          style="float:right"
          @click="onAddFiles") +Add Files

      .file-area
        .files
          .emptyMessage(v-if="project.files && project.files.length === 0")
            span No files yet.
          .fileList(v-else)
            .fileItem(v-for="file in filesToShow" @click="clickedFile(file)")
              list-element( v-bind:key="file.id")
                .itemTitle(slot="title")
                  span {{file.userFileName}}
                  span {{readableFileSize(file.sizeInBytes)}}
                button.delete(slot="accessory" v-on:click.stop="onDeleteFile(file.id, file.userFileName)") Delete

      .upload-area(v-if="uploads.length > 0")
        hr
        h5.title.is-5 PENDING UPLOADS

        section.uploads
            .upload-header
                .fileItem(v-for="upload in uploads")
                  list-element
                    .itemTitle(slot="title")
                      span {{ upload.file.name }}
                      span {{ toPercentage(upload.progress) }}%
                    span(slot="content") {{ toStatus(upload.status) }}

  input.fileInput(type="file"
      multiple
      id="fileInput"
      ref="fileInput"
      @change="onFileInput")

  create-visualization(v-if="showCreateVisualization"
                        @close="onAddVisualizationClosed"
                        @updated="projectStoreChanged"
                        :ownerId = "owner"
                        :projectId = "urlslug"
                        :runId = "run"
                        :projectStore="projectStore"
                        :fileApi="fileApi"
                        :editVisualization="editVisualization")

</template>

<script lang="ts">
import download from 'downloadjs'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import CloudAPI from '@/communication/FireBaseAPI'
import CreateVisualization from '@/components/CreateVisualization.vue'
import FileAPI from '@/communication/FileAPI'
import ListElement from '@/components/ListElement.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import ProjectSettings from '@/project/ProjectSettings.vue'
import ProjectStore from '@/project/ProjectStore'
import SharedStore, { SharedState } from '@/SharedStore'
import UploadStore, { FileUpload, UploadStatus } from '@/project/UploadStore'
import { Visualization, FileEntry } from '@/entities/Entities'
import VizThumbnail from '@/components/VizThumbnail.vue'

const vueInstance = Vue.extend({
  props: {
    projectStore: ProjectStore,
    uploadStore: UploadStore,
    owner: String,
    run: String,
    urlslug: String,
    fileApi: FileAPI,
  },
  components: {
    CreateVisualization,
    ImageFileThumbnail,
    ListElement,
    MarkdownEditor,
    ProjectSettings,
    VizThumbnail,
    Drag,
    Drop,
  },
  data() {
    return {
      projectState: this.projectStore.State,
      sharedState: SharedStore.state,
      uploadState: this.uploadStore.State,
    }
  },
})

@Component
export default class RunPage extends vueInstance {
  private showCreateVisualization = false
  private showFileUpload = false
  private showSettings = false
  private isDragOver = false
  private editVisualization?: Visualization
  private selectedFiles: File[] = []
  private myProject: any = {}
  private myRun: any = { notes: '' }
  private myVisualizations: any[] = []
  private got404 = false

  private defaultRun = 'default'

  private get isFetching() {
    return this.projectState.isFetching
  }

  private get project() {
    return this.projectState.selectedProject
  }

  private get uploads() {
    return this.uploadState.uploads.filter(upload => upload.project.id === this.project.id)
  }

  private get filesToShow() {
    return this.project.files.filter(f => {
      // default run shows untagged files:
      if (this.run === this.defaultRun) return f.tags.length === 0
      // for other runs check if run tag matches
      for (const tag of f.tags) {
        if (tag.name === this.run) return true
      }
      return false
    })
  }

  public async created() {}

  public async mounted() {
    const project = await CloudAPI.getProject(this.owner, this.urlslug)
    if (!project) {
      this.got404 = true
      throw Error('No such page')
    }

    const run = await CloudAPI.getRun(this.owner, this.urlslug, this.run)
    if (!run) {
      this.got404 = true
      throw Error('No such page')
    }

    this.myProject = project
    this.myRun = run

    await this.projectStore.selectProject(this.myProject.mvizkey)
    await this.projectStore.filterFilesByTag(this.run)

    let vizes: Visualization[] = await CloudAPI.getVisualizations(this.owner, this.urlslug, this.run)
    if (vizes) {
      vizes = vizes.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      this.myVisualizations = vizes
    }
  }

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    console.log({ to, from })
  }

  private async onDrop(files: any) {
    this.selectedFiles = files
    this.showFileUpload = true
  }

  private async saveNotes(notes: string) {
    console.log({ notes })
    this.myRun.notes = notes
    await CloudAPI.updateDoc(`users/${this.owner}/projects/${this.urlslug}/runs/${this.run}`, this.myRun)
  }

  private async onNameChanged(name: string, event: any) {
    try {
      await this.projectStore.changeNameOfSelectedProject(name)
    } catch (error) {
      console.log(error)
    }
  }

  private readableFileSize(bytes: number): string {
    return filesize(bytes)
  }

  private onSelectVisualization(viz: any) {
    this.$router.push({ path: `/${viz.type}/${viz.projectId}/${viz.id}` })
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

  private onAddVisualization() {
    console.log('CREATE VIZ')
    this.editVisualization = undefined
    this.showCreateVisualization = true
  }

  private onAddVisualizationClosed() {
    this.showCreateVisualization = false
  }

  private async onDeleteFile(fileId: string, userFileName: string) {
    const confirmDelete = confirm(`Delete ${userFileName}?`)
    if (!confirmDelete) return

    try {
      await this.projectStore.deleteFile(fileId)
    } catch (error) {
      console.log(error)
    }
  }

  private async clickedFile(item: FileEntry) {
    const confirmDownload = confirm(`Download ${item.userFileName}?\nFile is ${filesize(item.sizeInBytes)}.`)
    if (!confirmDownload) return

    const blob = await this.fileApi.downloadFile(item.id, this.project.id)
    download(blob, item.userFileName, item.contentType)
  }

  private async projectStoreChanged() {
    console.log('projectStore changed!')
    const viz: any[] = await CloudAPI.getVisualizations(this.owner, this.urlslug, this.run)
    if (viz) {
      // reverse sort by update timestamp
      viz.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      this.myVisualizations = viz
    }
  }

  private async onFileInput() {
    const files = (this.$refs.fileInput as any).files
    console.log(files)
    this.selectedFiles = files
    this.uploadSelectedFiles()
  }

  private onAddFiles() {
    const input = this.$refs.fileInput as HTMLInputElement
    input.click()
  }

  private onAddFilesClosed() {
    this.showFileUpload = false
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

  private async uploadSelectedFiles() {
    console.log({ selectedFiles: this.selectedFiles })
    this.showFileUpload = true

    // figure out tag
    const runTags = this.project.tags.filter(t => t.name === this.run)

    const uploads: FileUpload[] = []

    for (const z of Object.values(this.selectedFiles)) {
      uploads.push({
        project: this.project,
        file: z,
        tags: runTags,
        status: UploadStatus.NotStarted,
        progress: 0,
      })
    }

    this.uploadStore.uploadFiles(uploads)
  }
}
</script>

<style scoped>
.content-area {
  margin: 0rem 2rem 2rem 2rem;
  background-color: #fff;
}

.title-strip {
  padding: 1.5rem 2rem 2rem 2rem;
  background-color: #f4f4f4;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.center {
  text-align: center;
  font-weight: bold;
}

.right {
  text-align: right;
}

.viz-table {
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, 25rem);
  list-style: none;
  padding-left: 0px;
  margin-top: 2rem;
  margin-bottom: 0px;
  overflow-y: auto;
}

.viz-item {
  display: table-cell;
  padding: 0 0 0 0;
  vertical-align: top;
  margin-right: 1rem;
  margin-bottom: 1rem;
}

th,
td {
  padding: 0.25rem 1rem 0.25rem 0rem;
}

a:hover {
  color: purple;
}

.tagline {
  margin-top: 0.5rem;
  margin-bottom: 0rem;
}

.new-viz-button {
  margin-right: 1rem;
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

.fileInput {
  display: none;
}

.upload-header {
  border-bottom: 1px solid lightgray;
  width: 100%;
  padding-bottom: 1.5rem;
}

@media only screen and (max-width: 640px) {
  .title-strip {
    padding: 1.5rem 1rem 2rem 1rem;
  }

  .content-area {
    margin: 2rem 1rem;
  }
}
</style>
