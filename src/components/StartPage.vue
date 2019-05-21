<template lang="pug">
.page-content
  .start-page-content
    h2.title.is-2 Welcome to MATSim-Viz!
    p.info You've found the MATSim Visualizer, an experimental web-based visualization platform for exploring MATSim outputs.
    p.info This tool is being developed by the VSP Department at the Technische Universität in Berlin, Germany.

    .about(v-if="isAuthenticated")
      h4.title.is-4 My Projects
      list-header(v-on:btnClicked="onCreateClicked" title="" btnTitle="New Project")

      div.emptyMessage(v-if="personalProjects.length === 0")
        p.info You don't have any projects yet. Create one!
      .projectList(v-else)
        list-element(v-for="project in personalProjects"
                  v-bind:key="project.id"
                  v-on:itemClicked="onProjectSelected(project)")
          span(slot="title") {{project.name}}
          span(slot="content") {{project.id}}
          button.delete.is-medium(slot="accessory" @click="onDeleteProject(project)")

    .about
     h4.title.is-4 Public Projects
     p.info Researchers have made these results available on the open web. Have a look around!

    ul.projects
     .project-row(v-for="project in publicProjects" :key="project.id")
       project-list-item(v-if="project.visualizations && project.visualizations.length > 0"
                       :project="project"
                       :project-store="projectStore"
                       @viz-selected="onVizSelected") {{ project.name }}

    .about
      h4.title.is-4 About MATSim
      p.info You can find out more about MATSim at&nbsp;
        a(href="https://matsim.org" target="_blank") https://matsim.org

  create-project(v-if="showCreateProject" v-on:close="onCreateProjectClosed" v-bind:project-store="projectStore")
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import EventBus from '@/EventBus.vue'
import FileAPI from '@/communication/FileAPI'
import ProjectListItem from '@/components/ProjectListItem.vue'
import ListHeader from '@/components/ListHeader.vue'
import CreateProject from '@/project/CreateProject.vue'
import ProjectStore, { ProjectState, ProjectVisibility } from '@/project/ProjectStore'
import { Visualization, PermissionType, Project } from '@/entities/Entities'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ListElementVue from './ListElement.vue'

@Component({
  components: {
    'project-list-item': ProjectListItem,
    'list-header': ListHeader,
    'list-element': ListElementVue,
    'create-project': CreateProject,
  },
})
export default class StartPage extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  private showCreateProject = false

  // this assignment is necessary to make vue watch the state. Later we switch it out with the actual
  // state of the projectStore
  private projectState: ProjectState = {
    projects: [],
    selectedProject: {} as Project,
    isFetching: false,
  }

  private get isAuthenticated() {
    if (!this.authStore) return false
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  private get publicProjects() {
    return this.projectState.projects.filter(project => this.isPublicProject(project))
  }

  private get personalProjects() {
    return this.projectState.projects.filter(project => this.isPersonalProject(project))
  }

  public async created() {
    this.projectState = this.projectStore.State

    try {
      const publicProjectsPromise = this.projectStore.fetchPublicProjects()
      if (this.isAuthenticated) await this.projectStore.fetchPersonalProjects()
      // start fetching data as soon as possible. Hence do this in 'created' callback
      await publicProjectsPromise
      this.publicProjects.forEach((project: any) => this.projectStore.fetchVisualizationsForProject(project))
    } catch (error) {
      console.log(error)
    }
  }

  public mounted() {
    EventBus.$emit('set-breadcrumbs', [])
  }

  public async thingie() {}

  private onVizSelected(viz: Visualization) {
    this.$router.push({ path: `/${viz.type}/${viz.project.id}/${viz.id}` })
  }

  private onProjectSelected(project: Project) {
    this.$router.push({ path: `/project/${project.id}` })
  }

  private onCreateClicked() {
    this.showCreateProject = true
  }

  private onCreateProjectClosed() {
    this.showCreateProject = false
  }

  private async onDeleteProject(project: Project) {
    try {
      await this.projectStore.deleteProject(project)
    } catch (error) {
      console.log('error')
    }
  }

  private isPublicProject(project: Project) {
    return project.permissions.findIndex(permission => permission.agent.authId === 'allUsers') >= 0
  }

  private isPersonalProject(project: Project) {
    return (
      project.permissions.findIndex(permission => permission.agent.authId === this.authStore.state.idToken.sub) >= 0
    )
  }
}
</script>

<style scoped>
.page-content {
  background-color: white;
}

.start-page-content {
  padding: 3rem 3rem;
  overflow-y: auto;
  max-width: 60rem;
  margin: auto;
  border-top: 2rem solid #cc5427;
}

.about {
  margin-top: 4rem;
  padding-top: 0.25rem;
  border-top: 0.2rem solid #479ccc;
}

.about h4 {
  color: #479ccc;
}

.public-gallery {
  border-top: 0.2rem solid #479ccc;
}

.projects {
  margin-top: 2rem;
}
</style>
