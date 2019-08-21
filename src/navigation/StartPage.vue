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

    .about(v-show="appState.currentUser")
      h4.title.is-4 Hello, {{ appState.currentUser }}
      p Jump to your
        b: router-link(:to='`/${appState.currentUser}`') &nbsp;home page: &raquo; {{ appState.currentUser }}

    .about
      h4.title.is-4 Visualization Gallery
      p.info The following example visualizations are available without a login. Note these are for illustrative purposes only. No real scenario data is depicted.

      ul.projects
        li.project(v-for="project in publicProjects" :key="project.id")
            h5.title.is-5 {{ project.title ? project.title : project.urlslug}}
            ul.visualizations
              li.visualization-item(v-for="viz in project.visualizations"
                  :key="viz.id"
                  @click="onVizSelected(viz)")
                viz-thumbnail(:viz="viz")

    .about
      h4.title.is-4 About MATSim
      p.info You can find out more about MATSim at&nbsp;
        a(href="https://matsim.org" target="_blank") https://matsim.org
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import EventBus from '@/EventBus.vue'
import CloudAPI, { ProjectAttributes, VizAttributes } from '@/communication/FireBaseAPI'
import FileAPI from '@/communication/FileAPI'
import ProjectListItem from '@/components/ProjectListItem.vue'
import ListHeader from '@/components/ListHeader.vue'
import CreateProject from '@/project/CreateProject.vue'
import ProjectStore, { ProjectState, ProjectVisibility } from '@/project/ProjectStore'
import { Visualization, PermissionType, Project } from '@/entities/Entities'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import ListElementVue from '@/components/ListElement.vue'
import VizThumbnail from '@/components/VizThumbnail.vue'

@Component({
  components: {
    ProjectListItem,
    ListHeader,
    ListElementVue,
    CreateProject,
    VizThumbnail,
  },
})
export default class StartPage extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  private authState = this.authStore.state
  private appState = sharedStore.state

  private publicProjects: any = []

  // this assignment is necessary to make vue watch the state.
  // Later we switch it out with the actual state of the projectStore
  private projectState: ProjectState = {
    projects: [],
    selectedProject: {} as Project,
    isFetching: false,
  }

  private get isAuthenticated() {
    if (!this.authStore) return false
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  public async created() {
    this.getPublicVisualizations()
  }

  private async getPublicVisualizations() {
    const vizes = await CloudAPI.getPublicVisualizations()
    const projList = vizes.sort((a: any, b: any) => (a.urlslug < b.urlslug ? -1 : 1))
    this.publicProjects = projList

    this.getFullProjectNames()
  }

  private async getFullProjectNames() {
    for (const project of this.publicProjects) {
      const details = await CloudAPI.getProjectById(project.id)
      if (details) project.title = details.title
      console.log(project)
    }
    console.debug({ thing: this.publicProjects })
  }

  private onVizSelected(viz: any) {
    this.$router.push({ path: `/${viz.type}/${viz.projectId}/${viz.id}` })
  }

  private onProjectSelected(project: ProjectAttributes) {
    this.$router.push({ path: `/${project.owner}/${project.urlslug}` })
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
  margin-left: auto;
  margin-right: 0.25rem;
  width: 320px;
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

.info-left {
  margin-right: 1rem;
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

.visualizations {
  margin-bottom: 2rem;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, 325px);
}

.visualization-item {
  display: table-cell;
  vertical-align: top;
  width: 325px;
  padding: -20px;
}

.hoverable:hover {
  cursor: pointer;
  text-decoration: none;
  box-shadow: 1px 3px 5px rgba(0, 0, 80, 0.3);
}

@media only screen and (max-width: 640px) {
  .page-content {
    padding: 0rem 0rem;
    margin: 0.5rem 1rem;
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
    margin: 0.5rem 1rem 0.5rem auto;
  }

  .hide-mobile {
    display: none;
  }
}
</style>
