<template lang="pug">
.page-content
  .hero.is-success
    .hero-body
      p.title Welcome to MATSim-Viz
      p.subtitle You've found the "MATSim Visualizer" which is an experimental web-based visualization platform for exploring MATSim outputs. Pick a dataset to explore from those below. More to come!

  .start-page-content
    h3.title.is-3 Visualization Gallery
    ul.projects
      project-list-item(v-for="project in projects"
                        v-bind:key="project.id"
                        v-bind:project="project"
                        v-bind:project-store="projectStore"
                        v-on:viz-selected="onVizSelected") {{ project.name }}

    .about
      h3.title.is-3 About MATSim
      p You can find out more about MATSim at&nbsp;
        a(href="https://matsim.org" target="_blank") https://matsim.org
</template>

<script lang="ts">
import sharedStore from '@/SharedStore'
import EventBus from '@/EventBus.vue'
import { Vue, Component, Prop } from 'vue-property-decorator'
import ProjectStore, { ProjectState } from '@/project/ProjectStore'
import FileAPI from '@/communication/FileAPI'
import ProjectListItem from '@/components/ProjectListItem.vue'
import { Visualization } from '@/entities/Entities'

@Component({
  components: { 'project-list-item': ProjectListItem },
})
export default class StartPage extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  private get projects() {
    return this.projectStore.State.projects
  }

  public created() {}

  public async mounted() {
    try {
      await this.projectStore.fetchProjects()
      this.projects.forEach(project => this.projectStore.fetchVisualizationsForProject(project))
    } catch (error) {
      console.log(error)
    }
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
</style>
