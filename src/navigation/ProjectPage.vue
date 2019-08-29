<template lang="pug">
#page
  .got404(v-if="got404")
    .title-strip
      p {{owner}} / {{urlslug}}
      h3.title.is-3 404 Not Found

  .stuff(v-else)
    .title-strip
      p
        router-link(:to='`/${owner}`') {{owner}}
        | &nbsp;/ {{urlslug}}
      h4.title.is-3 {{myProject.title ? myProject.title : '&nbsp;'}}

    .content-area
      p.tagline: i {{ myProject.description ? myProject.description : "&nbsp;" }}

      .p-area(v-if="canModify")
        .notes(v-if="!showSettings" :class="{'flex-wide': !showSettings}")
          markdown-editor.readme(v-model="myProject.notes" @save="saveNotes")

        .settings(:class="{'flex-wide': showSettings}")
          button.button.is-small.is-rounded.is-light.is-pulled-right.project-settings-button(
            v-if="!showSettings"
            @click="showSettings=!showSettings") Project Settings...
          project-settings.project-settings(
              v-if="showSettings"
              @close="closedSettings()"
              :projectStore="projectStore"
              :authStore="authStore"
              :owner="owner"
              :attributes="myProject"
              :projectId="urlslug")

      .run-space

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

      new-run-dialog(v-if="showCreateRun"
                     :projectId="urlslug"
                     :mvizkey="project.id"
                     :owner="owner"
                     :fileApi="fileApi"
                     @close="onCreateRunClosed")

</template>

<script lang="ts">
import download from 'downloadjs'
import { File } from 'babel-types'
import filesize from 'filesize'
import { Drag, Drop } from 'vue-drag-drop'
import { falsy } from 'vega'

import { FileAttributes, RunAttributes, ProjectAttributes } from '@/communication/FireBaseAPI'
import AuthenticationStore from '@/auth/AuthenticationStore'
import sharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import CloudAPI from '@/communication/FireBaseAPI'
import FileAPI from '@/communication/FileAPI'
import ProjectStore from '@/project/ProjectStore'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import NewRunDialog from '@/components/NewRunDialog.vue'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Visualization, FileEntry, PermissionType } from '@/entities/Entities'
import ProjectSettings from '@/components/ProjectSettings.vue'

const vueInstance = Vue.extend({
  props: {
    authStore: AuthenticationStore,
    projectStore: ProjectStore,
    owner: String,
    urlslug: String,
    fileApi: FileAPI,
  },
  components: {
    ImageFileThumbnail,
    MarkdownEditor,
    NewRunDialog,
    ProjectSettings,
    VizThumbnail,
    Drag,
    Drop,
  },
  data() {
    return {
      projectState: this.projectStore.State,
      sharedState: sharedStore.state,
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
  private canModify = false
  private showCreateRun = false
  private myRuns: any[] = []
  private got404 = false

  private myProject: ProjectAttributes = {
    owner: this.owner,
    title: '',
    urlslug: this.urlslug,
    description: '',
    notes: '',
  }

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

  public async created() {}

  public async mounted() {
    const project: any = await CloudAPI.getProject(this.owner, this.urlslug)
    if (project) this.myProject = project
    else {
      this.got404 = true
      throw Error(`Did not find exactly one project for /${this.owner}/${this.urlslug}`)
    }

    // handle MATSim-Viz FileServer projects
    if (this.myProject.mvizkey) {
      await this.projectStore.selectProject(this.myProject.mvizkey)
      // upgrade from old server?
      if (!this.myProject.imported) {
        await this.importMVizProject()
        await CloudAPI.updateDoc(`users/${this.owner}/projects/${this.urlslug}`, { imported: true })
      }
    }

    this.fetchRuns()
    this.canModify = await this.determineIfUserCanModify()
  }

  private async closedSettings() {
    this.showSettings = false

    const project: any = await CloudAPI.getProject(this.owner, this.urlslug)
    if (project) this.myProject = project
  }

  private async importMVizProject() {
    console.log('--- importing old project!')

    const defaultRun = 'default'
    const fileSet: any = {}

    // build lookup of runs & files
    for (const item of this.project.files) {
      let run = defaultRun
      for (const tag of item.tags) {
        if (tag.type === 'run') run = tag.name
      }

      if (!fileSet[run]) fileSet[run] = []
      fileSet[run].push(item)
    }

    // Create the runs
    for (const run of Object.keys(fileSet)) {
      console.log('-- creating', run)

      await CloudAPI.createRun({
        owner: this.owner,
        project: this.urlslug,
        runId: run,
        notes: '',
        description: run === defaultRun ? 'Uncategorized files were moved here.' : '',
      })

      // Add all the files to the runs
      const fileDetails = fileSet[run].map((f: any) => {
        return {
          owner: this.owner,
          project: this.urlslug,
          runId: run,
          filename: f.userFileName,
          sizeinbytes: f.sizeInBytes,
          mvizkey: f.id,
        }
      })

      try {
        await CloudAPI.addFiles(fileDetails)
      } catch (e) {
        console.log({ e })
      }

      // Now import orphaned visualizations
      const visualizations: any = this.project.visualizations.map(viz => {
        console.log({ PARAMETERS: '' + viz.parameters })

        const parameters: any = {}
        for (const p of Object.keys(viz.parameters)) {
          parameters[p] = viz.parameters[p].value
        }

        return {
          owner: this.owner,
          project: this.urlslug,
          runId: 'default',
          id: viz.id,
          properties: viz.properties,
          projectId: viz.project.id,
          parameters,
          type: viz.type,
          title: viz.title,
          createdAt: viz.createdAt,
          updatedAt: viz.updatedAt,
        }
      })
      await CloudAPI.addVisualizations(visualizations)
    }
  }

  private determineIfUserCanModify() {
    const perm = this.projectState.selectedProject.permissions.find(
      p => p.agent.authId === this.authStore.state.idToken.sub
    )
    if (!perm) return false
    return perm.type === PermissionType.Owner
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
    // toggle, if it's already selected
    if (this.selectedRun === modelRun.name) this.selectedRun = ''
    else this.selectedRun = modelRun.name
  }

  private async onDrop(files: any) {
    this.selectedFiles = files
    this.showFileUpload = true
  }

  private async saveNotes(notes: string) {
    console.log({ notes })
    this.myProject.notes = notes
    await CloudAPI.updateDoc(`users/${this.owner}/projects/${this.urlslug}`, this.myProject)
  }

  private async fetchRuns() {
    const runs: any[] = await CloudAPI.getRuns(this.owner, this.urlslug)
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
  margin: 0rem 2rem 2rem 2rem;
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
  /* border-bottom: solid 1px #ccf; */
}

.tagline {
  margin-top: 0.5rem;
  margin-bottom: 0rem;
}

.p-area {
  display: flex;
  flex-direction: row;
}

.notes {
  flex: 1;
  margin-right: 1rem;
}
.project-config {
  display: flex;
  flex-direction: row;
}

.project-settings-button {
  margin-top: -1.5rem;
}

.flex-wide {
  flex: 1;
}

.run-space {
  margin-top: 2rem;
}

.project-settings {
  margin: 0.5rem 0rem;
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
