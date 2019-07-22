<template lang="pug">
#page
  .title-strip
    p
      router-link(:to='`/${owner}`') {{owner}}
      router-link(:to='`/${owner}/${urlslug}`') /{{urlslug}}
      | /{{ run }}

    h4.title.is-3(v-if="myProject.title") {{myProject.title}} &bullet; {{run}}
    h4.title.is-3(v-else) &nbsp;

  .content-area
    h3.title.is-4 Run Dashboard

    // h5.title.is-5 VISUALIZATIONS
    // hr

    hr

    h5.title.is-5 FILES

    table.model-runs
      tr
        th File
        th.right Size
        th.right Actions
      tr(v-for="file in myFiles" :key="file.filename" @click="clickedFile(file)")
        td: b {{ file.filename }}
        td.right {{ readableFileSize(file.sizeinbytes) }}
        td.right ...
        // button.delete(slot="accessory" v-on:click="onDeleteFile(file.id)") Delete

</template>

<script lang="ts">
import download from 'downloadjs'

import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import CloudAPI from '@/communication/FireBaseAPI'
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
    urlslug: String,
    fileApi: FileAPI,
  },
  components: {
    ImageFileThumbnail,
    VizThumbnail,
    ProjectSettings,
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
  private myProject: any = {}
  private myRun: any = {}
  private myFiles: any[] = []

  private get isFetching() {
    return this.projectState.isFetching
  }

  private get project() {
    return this.projectState.selectedProject
  }

  public async created() {}

  public async mounted() {
    const project = await CloudAPI.getProject(this.owner, this.urlslug)
    if (project) this.myProject = project

    const run = await CloudAPI.getRun(this.owner, this.urlslug, this.run)
    if (run) this.myRun = run

    const files = await CloudAPI.getFiles(this.owner, this.urlslug, this.run)
    if (files) this.myFiles = files

    console.log({ files })
  }

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    console.log({ to, from })
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

  private readableFileSize(bytes: number): string {
    return filesize(bytes)
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
.content-area {
  margin: 2rem 2rem;
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

th,
td {
  padding: 0.25rem 1rem 0.25rem 0rem;
}

a:hover {
  color: purple;
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
