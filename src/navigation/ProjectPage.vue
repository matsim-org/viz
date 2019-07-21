<template lang="pug">
#page
  .title-strip
    p /
      router-link(:to='`/${owner}`') {{owner}}
      | /{{urlslug}}
    h4.title.is-3 {{myProject.title ? myProject.title : '&nbsp;'}}

  .content-area
    p.tagline: i {{ myProject.description ? myProject.description : "&nbsp;" }}

    h5.title.is-5 RUNS
      button.button.is-rounded.is-danger.is-outlined(
        style="float:right"
        v-if="canModify"
        @click="clickedNewRun") +New Run

    table.project-list
      tr
        th(style="min-width: 9rem;") Run ID
        th Description

      tr(v-for="run in myRuns")
        td: b: router-link(:to='`/${owner}/${urlslug}/${run.runId}`') {{ run.runId }}
        td {{ run.description }}

    new-run-dialog(v-if="showCreateRun" :projectId="urlslug" :owner="owner" @close="onCreateRunClosed")

</template>

<script lang="ts">
import download from 'downloadjs'

import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import CloudAPI from '@/communication/FireBaseAPI'
import FileAPI from '@/communication/FileAPI'
import ProjectStore from '@/project/ProjectStore'
import NewRunDialog from '@/navigation/NewRunDialog.vue'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Visualization, FileEntry } from '@/entities/Entities'
import ProjectSettings from '@/project/ProjectSettings.vue'
import { falsy } from 'vega'

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
    NewRunDialog,
    ProjectSettings,
    VizThumbnail,
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
export default class ProjectPage extends vueInstance {
  private showCreateVisualization = false
  private showFileUpload = false
  private showSettings = false
  private isDragOver = false
  private editVisualization?: Visualization
  private selectedFiles: File[] = []
  private selectedRun: string = ''
  private myProject = {}
  private canModify = false
  private showCreateRun = false
  private myRuns = []

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

  public async mounted() {
    const project = await CloudAPI.getProject(this.owner, this.urlslug)
    if (project) this.myProject = project
    else {
      throw Error(`Should have gotten exactly one project for /${this.owner}/${this.urlslug}`)
    }

    this.fetchRuns()
    this.canModify = await this.determineIfUserCanModify()
  }

  private async determineIfUserCanModify() {
    return await CloudAPI.canUserModify(this.owner)
  }

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    console.log({ to, from })
  }

  private clickedNewRun() {
    this.showCreateRun = true
  }

  private async onCreateRunClosed() {
    this.showCreateRun = false
    this.fetchRuns()
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

  private async fetchRuns() {
    const runs: any = await CloudAPI.getRuns(this.owner, this.urlslug)
    runs.sort((a: any, b: any) => (a.runId.toLowerCase() < b.runId.toLowerCase() ? -1 : 1))
    this.myRuns = runs
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
.content-area {
  margin: 2rem 2rem;
  background-color: #fff;
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

.title-strip {
  padding: 1.5rem 2rem 2rem 2rem;
  background-color: #f4f4f4;
}

.tagline {
  margin-top: -1.5rem;
  margin-bottom: 2rem;
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
