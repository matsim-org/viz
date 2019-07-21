<template lang="pug">
.page-content
    .masthead
      .mobile-logo
        a(href="https://www.vsp.tu-berlin.de"): img.mobile-logo(src='/vsp-logo.png')

      .info-left
        h2.title.is-2 Welcome to&nbsp;
          b MatHub
        p You've found the "MATSim Hub", the MATSim data portal and results visualizer.
        p.hide-mobile This is an experimental web-based platform for exploring MATSim outputs, developed by the TU Berlin Institute of Land and Sea Transportation.
        p.hide-mobile
          a(href="https://matsim.org") MATSim
          |  is an open-source framework for implementing large-scale agent-based transport simulations.
      .info-right.hide-mobile
        img.vsp-logo(src='/vsp-logo.png')
        p Transport Systems Planning<br/>and Transport Telematics
        p Technische Universität<br/>Berlin, Germany
        p: a(href="https://vsp.tu-berlin.de") vsp.tu-berlin.de

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
      h4.title.is-4 Visualization Gallery
      p.info The following example visualizations are available without a login. Note these are for illustrative purposes only. No real scenario data is depicted.

      ul.projects
      .project-row(v-for="project in publicProjects" :key="project.id")
        project-list-item(v-if="project.visualizations && project.visualizations.length > 0"
                        :project="project"
                        :project-store="projectStore"
                        @viz-selected="onVizSelected") {{ project.name }}

      p.info If you have a MATSim-Viz login, you may have access to additional projects and visualizations.

    .about
      h4.title.is-4 About MATSim
      p.info You can find out more about MATSim at&nbsp;
        a(href="https://matsim.org" target="_blank") https://matsim.org
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
import ListElementVue from '@/components/ListElement.vue'

import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebaseui/dist/firebaseui.css'
import * as firebaseui from 'firebaseui'

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
    if (!this.projectStore) return

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

  private onVizSelected(viz: Visualization) {
    this.$router.push({ path: `/${viz.type}/${viz.project.id}/${viz.id}` })
  }

  private onProjectSelected(project: Project) {
    this.$router.push({ path: `/project/${project.id}` })
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
  padding: 0rem 2rem 2rem 2rem;
  margin-bottom: 5rem;
}

.about {
  margin-top: 4rem;
  padding-top: 0rem;
  border-top: 0.15rem solid #479ccc;
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

.masthead {
  display: flex;
  flex-direction: row;
  margin-top: 3rem;
}

.vsp-logo {
  margin-left: auto;
  width: 200px;
  max-width: 200px;
}

.info-right {
  border-left: solid 1px #ddd;
  padding: 0.25rem 0rem 0.25rem 1rem;
  margin-left: 1rem;
  margin-right: 0.25rem;
  width: 300px;
  text-align: right;
  font-size: 12px;
}

p {
  margin-top: 8px;
}

.info-right p {
  margin-top: 8px;
  line-height: 1.1;
  margin-left: auto;
  width: 260px;
}

a {
  color: #479ccc;
}

a:hover {
  color: #b50e1f;
}

.info-right a {
  color: #c50e1f;
}

.info-right a:hover {
  color: #479ccc;
}

.mobile-logo {
  display: none;
}

@media only screen and (max-width: 640px) {
  .page-content {
    padding: 0rem 0rem;
    margin: 3rem 1rem;
  }

  .masthead {
    display: flex;
    flex-direction: column;
    margin-top: 1rem;
  }

  .mobile-logo {
    display: inherit;
    text-align: right;
    width: 150px;
    margin: 0rem 1rem 0rem auto;
  }

  .hide-mobile {
    display: none;
  }
}
</style>
