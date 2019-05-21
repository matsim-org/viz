<template lang="pug">
modal(@close-requested="cancel()")
    div(slot="header") {{editVisualization ? 'Edit' : 'Create New'}} Visualization

    div(slot="content")
      .viz-selector
        aside.menu
          p.menu-label Select:
          ul.menu-list
            li(v-for="viz in availableVisualizations")
              a(:class="{'is-active': selectedVizType && viz.typeName===selectedVizType.typeName}" @click="onVizTypeChanged(viz)") {{viz.prettyName}}
        .viz-details(v-if="showDetails" )
            p.description(v-if="selectedVizType.description") {{selectedVizType.description}}

            .field
              label.label Title
              .control
                input.input(type="text" v-model="title" v-focus)
            .field
              label.label Description
              .control
                textarea.textarea(v-model="description")

            .viz-parameters(v-for="key in selectedVizType.requiredParamKeys")
              .field
                label.label {{key}}
                .control
                  input.input(v-model="parameters[key]" placeholder="")
                // placeholder="Required"

            .viz-files(v-for="key in selectedVizType.requiredFileKeys")
              .field
                label.label {{key}}
                .control.dropdown.is-left(:class="{'is-active': openDropdown==key}")
                  .dropdown-trigger
                    button.button.is-small(@click="toggleDropdown(key)" aria-haspopup="true" aria-controls="dropdown-menu")
                      span {{ inputFiles[key] ? fileLookup.get(key) : 'Choose&hellip;' }}
                      span.icon.is-small
                        i.fas.fa-angle-down(aria-hidden="true")
                  .dropdown-menu(:id="'dropdown-menu'+key" role="menu")
                    .dropdown-content
                      a.dropdown-item(v-for="file in project.files" @click='onFileChanged(key, file)') {{file.userFileName}}

      error(v-if="isError" v-bind:message="errorMessage")
    div(slot="actions")
      .bottom-panel
        div(v-if="isRequesting")
          .ui.active.small.inline.loader
        div(v-else)
          button.button.negative(@click="cancel()") Cancel
          button.button.is-link.accent(@click="createVisualization()") Create
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import Modal from '@/components/Modal.vue'
import Error from '@/components/Error.vue'
import FileAPI, { CreateVisualizationRequest } from '../communication/FileAPI'
import SharedStore, { SharedState } from '../SharedStore'
import ProjectStore from '@/project/ProjectStore'
import { VisualizationType, Project, Visualization } from '@/entities/Entities'
import DummyThumbnail from '@/project/DummyThumbnail'

@Component({
  components: {
    modal: Modal,
    error: Error,
  },
})
export default class CreateVisualizationViewModel extends Vue {
  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ required: true })
  private editVisualization?: Visualization

  private sharedState = SharedStore.state

  private isVizListOpen = false
  private isRequesting = false
  private errorMessage = ''
  private selectedVizType: VisualizationType = this.createEmtpyVisualizationType()
  private openDropdown = ''
  private fileLookup: Map<string, string> = new Map()

  private title = ''
  private description = ''
  private parameters: { [key: string]: string } = {}
  private inputFiles: { [key: string]: string } = {}

  private get showDetails(): boolean {
    return this.selectedVizType.typeName !== ''
  }

  private get projectState() {
    return this.projectStore.State
  }

  private get project() {
    return this.projectState.selectedProject
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private get availableVisualizations() {
    const vizes = Array.from(this.sharedState.visualizationTypes.values())
    return vizes.sort((a, b) => {
      return a.prettyName > b.prettyName ? 1 : -1
    })
  }

  private created() {
    // If dialog is being created with editVisualization filled in, then fill in the details!
    if (this.editVisualization) this.updateContents(this.editVisualization)
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }

  private updateContents(viz: Visualization) {
    if (SharedStore.debug) console.log({ UPDATE: viz })

    this.setUpInputProperties()

    const chosenViz = this.availableVisualizations.filter(v => v.typeName === viz.type)[0]

    this.selectedVizType = chosenViz
    this.onVizTypeChanged(this.selectedVizType)

    // fill in parameters
    for (const p in viz.parameters) {
      if (!viz.parameters.hasOwnProperty(p)) continue
      this.parameters[p] = viz.parameters[p].value
    }

    // fill in files
    for (const p in viz.inputFiles) {
      if (!viz.inputFiles.hasOwnProperty(p)) continue
      this.inputFiles[p] = viz.inputFiles[p].fileEntry.id
      this.onFileChanged(p, viz.inputFiles[p].fileEntry)
    }
  }

  private async createVisualization() {
    this.isRequesting = true
    try {
      const request: CreateVisualizationRequest = {
        projectId: this.project.id,
        typeKey: this.selectedVizType.typeName,
        title: this.title,
        tagIds: [], // not yet implemented
        thumbnail: DummyThumbnail, // not yet implemented
        properties: {
          description: this.description,
        },
        inputFiles: this.inputFiles,
        inputParameters: this.parameters,
      }
      const viz = await this.fileApi.createVisualization(request)
      this.projectStore.addVisualizationToSelectedProject(viz)

      // delete old viz, if we edited it
      if (this.editVisualization) this.projectStore.deleteVisualization(this.editVisualization)

      this.close()
    } catch (error) {
      console.log(error)
      this.errorMessage = 'Uh oh, something went wrong'
    } finally {
      this.isRequesting = false
    }
  }

  private onVizTypeChanged(value: VisualizationType) {
    this.setUpInputProperties()
    this.selectedVizType = value
  }

  private onFileChanged(key: string, event: any) {
    this.inputFiles[key] = event.id
    this.fileLookup.set(key, event.userFileName)
    this.toggleDropdown('')
  }

  private toggleDropdown(key: string) {
    if (this.openDropdown === key) this.openDropdown = ''
    else this.openDropdown = key
  }

  private setUpInputProperties() {
    this.title = ''
    this.description = ''
    this.parameters = {}
    this.inputFiles = {}
  }

  private createEmtpyVisualizationType(): VisualizationType {
    return {
      typeName: '',
      prettyName: '',
      requiredFileKeys: [],
      requiredParamKeys: [],
    }
  }
}
</script>
<style scoped>
.bottom-panel {
  width: 100%;
  float: right;
}
.viz-selector {
  display: grid;
  grid-template-columns: auto 1fr;
}
.viz-details {
  padding-left: 30px;
  align-self: stretch;
}
.viz-files {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.viz-parameters {
  margin-bottom: 12px;
}
.viz-file {
  padding: 5px 0px;
}

.description {
  margin-bottom: 1rem;
}

h4 {
  color: #479ccc;
  text-transform: uppercase;
}

.menu-label {
  color: #479ccc;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0px;
}

.accent {
  background-color: #2d76a1;
}

.accent:hover {
  background-color: #256083;
}
</style>

