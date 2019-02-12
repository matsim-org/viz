<template lang="pug">
.page-content
  .start-page-content
    h1.title.is-1 Welcome to MATSim-Viz!
    p.info You've found the MATSim Visualizer, an experimental web-based visualization platform for exploring MATSim outputs.
    p.info This tool is being developed at the Technische Universität in Berlin, Germany.

    .about(v-if="isAuthenticated")
      h3.title.is-3 My Projects
      my-projects( :projectStore="projectStore")

    .about
      h3.title.is-3 Public Gallery
      p.info Researchers have made these results available on the open web. Have a look around!

    ul.projects
      project-list-item(v-for="project in projects"
                        :key="project.id"
                        :project="project"
                        :project-store="projectStore"
                        @viz-selected="onVizSelected") {{ project.name }}

    .about
      h3.title.is-3 About MATSim
      p.info You can find out more about MATSim at&nbsp;
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
.page-content {
  background-color: #eee;
}

.hero {
  max-width: 90rem;
  margin: auto;
}

.start-page-content {
  padding: 3rem 3rem;
  overflow-y: auto;
  max-width: 90rem;
  margin: auto;
  border-top: 2rem solid #cc5427;
}

.about {
  margin-top: 4rem;
  padding-top: 0.25rem;
  border-top: 0.2rem solid #479ccc;
}

.about h3 {
  color: #479ccc;
}

.public-gallery {
  border-top: 0.2rem solid #479ccc;
}

.info {
  font-size: 1.25rem;
}

.projects {
  margin-top: 2rem;
}
</style>
