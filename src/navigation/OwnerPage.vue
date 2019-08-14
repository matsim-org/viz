<template lang="pug">
#page
  .user-detail-nag-area(v-if="nagUser")
    h2 Please add your full name to finish account creation:
    .things(id="form" v-on:submit.prevent="addUser")
      input.input(type="text" v-model="newUserName" placeholder="Full name")
      button.button.is-link.account-button(:disabled="!validation.name" @click="saveUser") Finish
    ul.errors
      li(v-show="!validation.name") Name cannot be empty.

  .title-strip
    p {{owner}} /
    h3.title.is-3 {{ owner }} &bullet; Home

  .content-area
    p.tagline(v-if="ownerDetails"): i {{ ownerDetails.details }}

    markdown-editor.readme(v-model="ownerDetails.notes" @save="saveNotes")

    h5.title.is-5 PROJECTS
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
import SharedStore, { SharedState } from '@/SharedStore'
import FileAPI from '@/communication/FileAPI'
import CloudAPI from '@/communication/FireBaseAPI'
import NewProjectDialog from '@/navigation/NewProjectDialog.vue'
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
  private newUserName = ''
  private nagUser = false

  private myProjects: any = []
  private ownerDetails: any = { notes: '', details: '' }
  private get isFetching() {
    return this.projectState.isFetching
  }

  private get project() {
    return this.projectState.selectedProject
  }

  private get validation() {
    return { name: !!this.newUserName.trim() }
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
    else this.nagUser = true

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
    console.log({ to, from })
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

  private async saveUser() {
    console.log({ SaveUser: this.newUserName })

    this.ownerDetails.details = this.newUserName
    try {
      // update existing user record
      await CloudAPI.updateDoc(`users/${this.owner}`, this.ownerDetails)
    } catch (e) {
      // no record yet, create one
      await CloudAPI.createDoc(`users/${this.owner}`, this.ownerDetails)
    }
    this.nagUser = false
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

.readme {
  padding-bottom: 1rem;
}

.user-detail-nag-area {
  padding: 1rem 2rem;
  width: 100%;
  background-color: #ec5;
}

.things {
  display: flex;
  flex-direction: row;
  padding-top: 0.25rem;
}

.account-button {
  margin-left: 0.5rem;
}

.errors {
  color: #c00;
  height: 1.5rem;
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
