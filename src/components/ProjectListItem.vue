<template lang="pug">
    li.project    
        h5.title.is-5 {{ project.name }}
        .visualizations(v-if="!isLoading")
            .visualization-item(
                    v-for="viz in project.visualizations"
                    v-bind:key="viz.id"
                    v-on:click="$emit('viz-selected', viz)")
                .card.bla
                    .card-image
                        img.img-responsive(src="@/assets/transit-supply.jpg")
                    .card-content
                        h6.card-title {{viz.type}}
                        .card-subtitle viz-{{viz.id.substring(0,4)}}
        spinner(v-else)    
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Spinner from '@/components/Spinner.vue'
import { Project } from '@/entities/Entities'
import VizThumbnail from '@/components/VizThumbnail.vue'
import ProjectStore from '@/project/ProjectStore'

@Component({
  components: {
    spinner: Spinner,
  },
})
export default class ProjectListItem extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore
  @Prop({ type: Object as () => Project, required: true })
  private project!: Project
  private isLoading = false

  public async created() {
    if (this.project.visualizations && this.project.visualizations.length > 0) {
      return
    }
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
}

.visualizations {
  min-height: 256px;
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: repeat(auto-fill, 240px);
}

.visualization-item {
  display: table-cell;
  vertical-align: top;
  width: 240px;
  padding: -20px;
}

.bla:hover {
  cursor: pointer;
  text-decoration: underline;
}
</style>


