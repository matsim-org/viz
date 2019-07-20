<template lang="pug">
#page
  .title-strip
    p /{{owner}}
    h3.title.is-3 {{ owner }} &bullet; Home

  .content-area
    p.tagline: i {{ me.details ? me.details : "&nbsp;" }}

    h5.title.is-5 PROJECTS
      button.button.is-rounded.is-danger.is-outlined(
        style="float:right"
        v-if="canModify"
        @click="clickedNewProject") +New Project

    table.project-list
      tr
        th(style="min-width: 9rem;") Project
        th Description

      tr(v-for="project in myProjects")
        td: b: router-link(:to='`/${project.owner}/${project.urlslug}`') {{ project.title }}
        td {{ project.description }}

    new-project-dialog(v-if="showCreateProject" :owner="owner" @close="onCreateProjectClosed")

</template>

<script lang="ts">
import download from 'downloadjs'

import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ImageFileThumbnail from '@/components/ImageFileThumbnail.vue'
import FileAPI from '@/communication/FileAPI'
import CloudAPI from '@/communication/FireBaseAPI'
import NewProjectDialog from '@/navigation/NewProjectDialog.vue'
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
    projectId: String,
    fileApi: FileAPI,
  },
  components: {
    ProjectSettings,
    NewProjectDialog,
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
export default class OwnerPage extends vueInstance {
  private showCreateVisualization = false
  private showFileUpload = false
  private showCreateProject = false
  private showSettings = false
  private isDragOver = false
  private editVisualization?: Visualization
  private selectedFiles: File[] = []
  private selectedRun: string = ''
  private canModify = false

  private myProjects: any = []
  private me: any = {}

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
    await this.fetchMe()
    await this.fetchProjects()
    this.canModify = await this.determineIfUserCanModify()
  }

  private async determineIfUserCanModify() {
    return await CloudAPI.canUserModify(this.owner)
  }

  private async fetchMe() {
    this.me = await CloudAPI.getOwner(this.owner)
    console.log({ me: this.me })
  }

  private async fetchProjects() {
    const projects = await CloudAPI.getProjectsForUser(this.owner)
    projects.sort((a: any, b: any) => a.title.toLowerCase() > b.title.toLowerCase())
    this.myProjects = projects
  }

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

  private clickedNewProject() {
    this.showCreateProject = true
  }

  private async onCreateProjectClosed() {
    this.showCreateProject = false
    this.fetchProjects()
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

.project-list {
  padding-top: 0rem;
  margin-top: 0rem;
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
    padding: 1.5rem 1rem;
  }

  .content-area {
    margin: 2rem 1rem;
  }
}
</style>
