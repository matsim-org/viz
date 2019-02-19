<template lang="pug">
#summary-strip
  .title-band
    .title-details
      h3.project-name {{project.name}}
      .subtitle: p project: {{project.id.substring(0,6)}}
    .editButton(@click="$emit('onEdit')")
      i.fa.fa-pen
    //.project-description
    //  p No description.

  .add-viz
    button.button.is-info.is-rounded.accent(@click="$emit('onAddVisualization')") Create Visualization

  .summary-category.modelTab
    h3.section-head Model Runs
    .modelRun(v-for="modelRun in modelRuns"
              @click="$emit('onSelectModelRun', modelRun)"
              :key="modelRun.name"
              :class="{selected: modelRun.name === selectedRun}") {{ modelRun.name }}
    p.gettingStarted(v-if="modelRuns.length===0") To get started, upload some files from a model run, such as a network.xml file or other standard MATSim outputs.
    p.gettingStarted(v-if="modelRuns.length===0") If you upload the contents of a MATSim output iteration, many standard visualizations will be available.

  .summary-category.dropzone
    h3.section-head Project Files
    drop.drop(
      :class="{over:isDragOver}"
      @dragover="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop="onDrop"
      effect-allowed='all'
    ) Drag/drop files here to upload!
    .add-files
      button.button.is-info.is-rounded.accent(@click="$emit('onAddFiles')") Upload Files

</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { File } from 'babel-types'
import { Drag, Drop } from 'vue-drag-drop'
import mediumZoom from 'medium-zoom'
import filesize from 'filesize'

import { Visualization, FileEntry } from '@/entities/Entities'
import CreateVisualization from '@/project/CreateVisualization.vue'
import EventBus from '@/EventBus.vue'
import FileUpload from '@/project/FileUpload.vue'
import ProjectStore from '@/project/ProjectStore'
import ProjectSettings from '@/project/ProjectSettings.vue'
import SharedStore, { SharedState } from '@/SharedStore'
import VizThumbnail from '@/components/VizThumbnail.vue'

@Component({
  components: {
    'create-visualization': CreateVisualization,
    'file-upload': FileUpload,
    'project-settings': ProjectSettings,
    Drag,
    Drop,
  },
})
export default class SummaryStrip extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: String, required: true })
  private selectedRun!: string

  private showCreateVisualization = false
  private showFileUpload = false
  private showSettings = false
  private isDragOver = false
  private selectedFiles: File[] = []

  private projectState = this.projectStore.State
  private sharedState = SharedStore.state

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

  public async created() {
    try {
      await this.projectStore.selectProject(this.projectId)
    } catch (error) {
      console.error(error)
      // do some error handling
    }
  }

  private async onSelectModelRun(modelRun: any) {
    // toggle, if it's already selected
    if (this.selectedRun === modelRun.name) this.selectedRun = ''
    else this.selectedRun = modelRun.name

    // the medium zoom library does things to the DOM, so this Vue hack is required
    await Vue.nextTick()
    mediumZoom('.medium-zoom', { background: '#444450' })
  }

  private async onFileInput() {
    const files = (this.$refs.fileInput as any).files
    this.selectedFiles = files
    this.showFileUpload = true
  }

  private async onDrop(data: any, event: any) {
    event.preventDefault()
    this.isDragOver = false
    const files = event.dataTransfer.files

    this.$emit('onDrop', files)
  }
}
</script>

<style scoped>
.summary-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  width: 16rem;
  height: 100vh;
  background-color: #242831;
  color: #eee;
  display: flex;
  flex-direction: column;
  animation: 0.3s ease 0s 1 slideInFromLeft;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.headline {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.fileInput {
  display: none;
}

.drop {
  padding: 1rem 3rem;
  margin: 1rem 0rem 1.5rem 0rem;
  text-align: center;
  border: 0.2rem dashed #aaa;
  border-radius: 0.25rem;
  color: #aaa;
  font-size: 0.8rem;
}

.drop:hover {
  border: 0.2rem dashed #ffa;
  color: white;
}

.drop.over {
  border: 0.2rem dashed #097c43;
  background-color: black;
  margin: 1rem -0.2rem 1.5rem -0.2rem;
}

.title-band {
  background-color: #363a45;
  padding: 1.5rem 1rem 2rem 1rem;
  text-align: center;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
}

.title-band h3 {
  color: #eee;
}

.title-band h4 {
  color: #aaa;
}

.title-details {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  margin: auto 0rem;
}

.editButton {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  color: #888;
  margin: auto 0rem auto 0.1rem;
  border: solid 1px #888;
  padding: 0.1rem 0.3rem;
  border-radius: 0.3rem;
}

.editButton:hover,
active {
  color: #ffa;
  border: solid 1px #ffa;
  cursor: pointer;
}

.project-description {
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  justify-content: center;
  padding: 1rem 0rem 0rem 0rem;
  color: #aaa;
}

.add-viz {
  padding: 2rem 1rem;
  text-align: center;
}

.add-files {
  padding-bottom: 1.2rem;
  text-align: center;
  width: 100%;
}

.accent {
  background-color: #097c43;
  width: 100%;
}

.accent:hover {
  background-color: #097733; /* #096c63; */
}

.summary-category {
  margin: 0rem 1rem 4rem 1rem;
}

.modelTab {
  margin-right: 0px;
}

.section-head {
  margin-bottom: 1rem;
  text-transform: uppercase;
  color: #479ccc;
  font-size: 0.9rem;
}

.viz-summary {
  display: flex;
  flex-direction: column;
}

.modelRun {
  padding: 0.3rem 0rem 0.3rem 1.2rem;
  font-size: 0.9rem;
  border-radius: 1.3rem 0rem 0rem 1.3rem;
  color: #eee;
}

.modelRun:hover {
  background-color: #363a45;
  cursor: pointer;
}

.modelRun.selected {
  background-color: #eee;
  color: #223;
}

.dropzone {
  margin-top: auto;
  margin-bottom: 0rem;
}

.gettingStarted {
  padding: 1rem 1rem 1rem 0rem;
  font-size: 0.8rem;
  color: #ccc;
}

.project-name {
  font-size: 1.2rem;
}

.subtitle {
  color: #999;
  font-size: 0.85rem;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
