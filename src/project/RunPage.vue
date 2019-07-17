<template lang="pug">
.project
  .center-area
    .main-area
      h3.title.is-3
        router-link(:to='"/"+owner') {{ owner }}&nbsp;
        | / {{run}}
      hr

      h5.title.is-5 VISUALIZATIONS
      table.model-runs
        tr
          th ID
          th Project
          th Notes
          th Actions
        tr.runz(v-for="run in myRuns")
          td: router-link(:to="'/'+owner+'/'+run.id") {{run.id}}
          td {{run.project}}
          td {{run.description}}
          td.right ...

      hr

      h5.title.is-5 FILES
      table.model-runs
        tr
          th ID
          th Project
          th Notes
          th Actions
        tr.runz(v-for="run in myRuns")
          td: router-link(:to="'/'+owner+'/'+run.id") {{run.id}}
          td {{run.project}}
          td {{run.description}}
          td.right ...

</template>

<script lang="ts">
import download from 'downloadjs'

import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import FileAPI from '@/communication/FileAPI'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import ProjectStore from '@/project/ProjectStore'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Visualization, FileEntry } from '@/entities/Entities'
import ProjectSettings from '@/project/ProjectSettings.vue'

const vueInstance = Vue.extend({
  props: {
    projectStore: ProjectStore,
    owner: String,
    run: String,
    projectId: String,
    fileApi: FileAPI,
  },
  components: {
    'image-file-thumbnail': ImageFileThumbnail,
    'viz-thumbnail': VizThumbnail,
    'project-settings': ProjectSettings,
    Drag,
    Drop,
  },
  data() {
    return {
      projectState: this.projectStore.State,
      sharedState: SharedStore.state,
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
  private selectedRun: string = ''

  private myRuns: any = [
    { id: 'run003', project: 'NEMO', description: 'Baseline 2015 scenario' },
    { id: 'run002', project: 'Avoev', description: 'Final results' },
    { id: 'run001', description: 'my test run' },
  ]

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

  public async created() {
    try {
      // await this.projectStore.selectProject(this.projectId)
    } catch (error) {
      console.error(error)
      // do some error handling
    }
  }

  public mounted() {}

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    console.log({ to, from })
  }

  private async onSelectModelRun(modelRun: any) {
    console.log('boop', modelRun)
    // toggle, if it's already selected
    if (this.selectedRun === modelRun.name) this.selectedRun = ''
    else this.selectedRun = modelRun.name
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

  private onSelectVisualization(viz: Visualization) {
    this.$router.push({ path: `/${viz.type}/${this.project.id}/${viz.id}` })
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
section {
  margin: 2rem 3rem 2rem 3rem;
}

.project {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
  background-color: #fff;
  height: 100%;
}

.summary-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 16rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.center-area {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  width: 100%;
  height: 100%;
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

.upload-header {
  border-bottom: 1px solid lightgray;
  width: 100%;
  padding-bottom: 1.5rem;
}

/*  background-color: #363a45; */

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

.right {
  text-align: right;
}

th,
td {
  padding: 0.25rem 1rem 0.25rem 0rem;
}

a:hover {
  color: purple;
}
</style>
