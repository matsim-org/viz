<template lang="pug">
#page
  .got404(v-if="got404")
    .title-strip
      p {{owner}} /
      h3.title.is-3 404 Not Found

  .stuff(v-else)
    .title-strip
      p {{owner}} /
      h3.title.is-3 {{ owner }} &bullet; Home

    .content-area(v-if="!got404")
      p.tagline: i {{ ownerDetails.details ? ownerDetails.details : '&nbsp;' }}

      markdown-editor.readme(v-model="ownerDetails.notes" @save="saveNotes")

      h5.title.is-5.projects PROJECTS
        button.button.is-rounded.is-danger.is-outlined(
          v-if="canModify"
          style="float:right"
          @click="clickedNewProject") +New Project

      table.project-list
        tr
          th Project
          th Description

        tr(v-for="project in myProjects")
          td: b: router-link(:to='`/${project.owner}/${project.urlslug}`') {{ project.title }}
          td {{ project.description }}

      new-project-dialog(v-if="showCreateProject" :owner="owner" @close="onCreateProjectClosed")

</template>

<script lang="ts">
import AccountPanel from '@/components/AccountPanel.vue'
import SharedStore, { SharedState } from '@/SharedStore'
import FileAPI from '@/communication/FileAPI'
import CloudAPI from '@/communication/FireBaseAPI'
import NewProjectDialog from '@/components/NewProjectDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
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
    AccountPanel,
    MarkdownEditor,
    ProjectSettings,
    NewProjectDialog,
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
  private editVisualization?: Visualization
  private selectedRun: string = ''
  private canModify = false

  private myProjects: any = []
  private ownerDetails: any = { notes: '', details: '' }
  private got404 = false

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

  public mounted() {
    this.buildPage()
  }

  public async buildPage() {
    await this.fetchOwnerDetails()
    await this.fetchProjects()
    this.canModify = await this.determineIfUserCanModify()
    await this.projectStore.fetchPersonalProjects()
  }

  private async determineIfUserCanModify() {
    return await CloudAPI.canUserModify(this.owner)
  }

  private async fetchOwnerDetails() {
    const details = await CloudAPI.getOwner(this.owner)
    if (details) this.ownerDetails = details
    else {
      this.got404 = true
      throw Error('No such page')
    }

    console.log({ details })
  }

  private async fetchProjects() {
    const projects = await CloudAPI.getProjectsForUser(this.owner)
    projects.sort((a: any, b: any) => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1))
    this.myProjects = projects

    console.log({ mvizProjects: this.projectStore })
  }

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    // this gets called if we navigate from one user page to another;
    // e.g. from the search box.
    console.log({ to, from })

    this.ownerDetails = { notes: '', details: '' }
    this.myProjects = []
    this.got404 = false

    this.buildPage()
  }

  private async onSelectModelRun(modelRun: any) {
    console.log('boop', modelRun)
    // toggle, if it's already selected
    if (this.selectedRun === modelRun.name) this.selectedRun = ''
    else this.selectedRun = modelRun.name
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

  private async saveNotes(notes: string) {
    console.log({ notes })
    this.ownerDetails.notes = notes

    if (!this.ownerDetails.details) await CloudAPI.createDoc(`users/${this.owner}`, this.ownerDetails)
    else await CloudAPI.updateDoc(`users/${this.owner}`, this.ownerDetails)
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
  margin-top: 0.5rem;
  margin-bottom: 0rem;
}

.readme {
  padding-bottom: 1rem;
}

.user-nag-area {
  padding: 2rem 2rem;
}

.things {
  display: flex;
  flex-direction: row;
  padding-top: 0.25rem;
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
