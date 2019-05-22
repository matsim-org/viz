<template lang="pug">
    li.project
        h5.title.is-5 {{ project.name }}
        .spinnerContainer(v-if="isLoading")
            spinner
        .visualizations(v-else)
            .visualization-item(
                v-for="viz in project.visualizations"
                :key="viz.id"
                @click="$emit('viz-selected', viz)")
              viz-thumbnail(v-if="viz.type != 'frame-animation'" :viz="viz")
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Project } from '@/entities/Entities'
import Spinner from '@/components/Spinner.vue'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ProjectStore from '@/project/ProjectStore'

@Component({ components: { spinner: Spinner, 'viz-thumbnail': VizThumbnail } })
export default class ProjectListItem extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore
  @Prop({ type: Object as () => Project, required: true })
  private project!: Project
  private isLoading = false

  public async created() {
    if (!this.project) return
    if (this.project.visualizations && this.project.visualizations.length > 0) return

    this.isLoading = true

    try {
      await this.projectStore.fetchVisualizationsForProject(this.project)
    } catch (error) {
      console.error(error)
    } finally {
      this.isLoading = false
    }
  }
}
</script>

<style scoped>
.project {
  list-style-type: none;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
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

.spinnerContainer {
  justify-self: center;
  align-self: center;
}

.card-image {
  background-color: #cc9547;
  height: 2rem;
}
</style>


