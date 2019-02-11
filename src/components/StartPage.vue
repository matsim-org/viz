<template lang="pug">
.page-content
  .hero.is-link
    .hero-body
      p.title Welcome to MATSim-Viz
      p.subtitle You've found the MATSim Visualizer, an experimental web-based visualization platform for exploring MATSim outputs. Pick a dataset to explore from those below. More to come!

  .start-page-content
    my-projects(v-if="isAuthenticated" :projectStore="projectStore")
    
    h3.public-gallery.title.is-3 Public Gallery
    ul.projects
      project-list-item(v-for="project in projects"
                        :key="project.id"
                        :project="project"
                        :project-store="projectStore"
                        @viz-selected="onVizSelected") {{ project.name }}

    .about
      h3.title.is-3 About MATSim
      p You can find out more about MATSim at&nbsp;
        a(href="https://matsim.org" target="_blank") https://matsim.org
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import EventBus from '@/EventBus.vue'
import FileAPI from '@/communication/FileAPI'
import ProjectListItem from '@/components/ProjectListItem.vue'
import Projects from '@/project/Projects.vue'
import ProjectStore, { ProjectState } from '@/project/ProjectStore'
import { Visualization } from '@/entities/Entities'
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({ components: { 'project-list-item': ProjectListItem, 'my-projects': Projects } })
export default class StartPage extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  // this assignment is necessary to make vue watch the state
  private projectState: any = {}

  private get isAuthenticated() {
    if (!this.authStore) return false
    return this.authStore.state.status === AuthenticationStatus.Authenticated
  }

  private get projects() {
    if (!this.projectState) return []
    return this.projectState.projects
  }

  public async created() {
    if (!this.projectStore) return

    try {
      this.projectState = this.projectStore.State

      // start fetching data as soon as possible. Hence do this in 'created' callback
      await this.projectStore.fetchProjects()
      this.projects.forEach((project: any) => this.projectStore.fetchVisualizationsForProject(project))
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
}
</script>

<style scoped>
.start-page-content {
  padding: 2rem 1.5rem;
  overflow-y: auto;
}

.about {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid lightgray;
}

.public-gallery {
  margin-top: 5rem;
}
</style>
