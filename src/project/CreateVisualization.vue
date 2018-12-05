<template lang="pug">
modal(v-on:close-requested="cancel()")
    span(slot="header")
      h3.title.is-3 Create Visualization

    div(slot="content")
      .viz-selector
        aside.menu
          p.menu-label Select:
          ul.menu-list
            li(v-for="viz in Array.from(sharedState.visualizationTypes.values())")
              a(:class="{'is-active': selectedVizType && viz.typeName==selectedVizType.typeName}" @click="onVizTypeChanged(viz)") {{viz.prettyName}}
        .viz-details(v-if="showDetails" )
          h3 {{selectedVizType.prettyName}}
          p(v-if="selectedVizType.description") {{selectedVizType.description}}
          br
          .viz-files(v-for="key in selectedVizType.requiredFileKeys")
            .viz-file
              b {{key}}
              .dropdown.is-right(style="float:right;" :class="{'is-active': openDropdown==key}")
                .dropdown-trigger
                  button.button.is-small(@click="toggleDropdown(key)" aria-haspopup="true" aria-controls="dropdown-menu")
                    span {{ request.inputFiles[key] ? fileLookup.get(key) : 'Choose&hellip;' }}
                    span.icon.is-small
                      i.fas.fa-angle-down(aria-hidden="true")
                .dropdown-menu(:id="'dropdown-menu'+key" role="menu")
                  .dropdown-content
                    a.dropdown-item(v-for="file in project.files" @click='onFileChanged(key, file)') {{file.userFileName}}

          .viz-parameters(v-for="key in selectedVizType.requiredParamKeys")
            .viz-file
              b {{key}}
              input.input(v-model="request.inputParameters[key]" placeholder="Required" style="float:right;")
      error(v-if="isError" v-bind:message="errorMessage")
    div(slot="actions")
      .bottom-panel
        div(v-if="isRequesting")
          .ui.active.small.inline.loader
        div(v-else)
          button.ui.negative.button(v-on:click="cancel()") Cancel
          button.button.is-link(v-on:click="createVisualization()") Create
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '@/components/Modal.vue'
import Error from '@/components/Error.vue'
import FileAPI, { CreateVisualizationRequest } from '../communication/FileAPI'
import SharedStore, { SharedState } from '../SharedStore'
import ProjectStore from '@/project/ProjectStore'
import { VisualizationType, Project } from '@/entities/Entities'

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

  private sharedState = SharedStore.state

  private isVizListOpen = false
  private isRequesting = false
  private errorMessage = ''
  private selectedVizType: VisualizationType = this.createEmtpyVisualizationType()
  private openDropdown = ''
  private fileLookup: Map<string, string> = new Map()
  private request = this.createEmptyRequest()

  private get showDetails(): boolean {
    return this.selectedVizType !== undefined
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

  private created() {
    this.request = {
      projectId: this.projectState.selectedProject.id,
      typeKey: 'raw-files',
      inputFiles: {},
      inputParameters: {},
    }
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }

  private async createVisualization() {
    this.isRequesting = true
    try {
      const viz = await this.fileApi.createVisualization(this.request)
      this.projectStore.addVisualizationToSelectedProject(viz)
      this.close()
    } catch (error) {
      console.log(error)
      this.errorMessage = 'Uh oh, something went wrong'
    } finally {
      this.isRequesting = false
    }
  }

  private onVizTypeChanged(value: VisualizationType) {
    this.clearRequest()
    this.request.typeKey = value.typeName
    this.selectedVizType = value
  }

  private onFileChanged(key: string, event: any) {
    this.request.inputFiles[key] = event.id
    this.fileLookup.set(key, event.userFileName)
    this.toggleDropdown('')
  }

  private toggleDropdown(key: string) {
    if (this.openDropdown === key) this.openDropdown = ''
    else this.openDropdown = key
  }

  private createEmptyRequest(): CreateVisualizationRequest {
    return {
      projectId: '',
      typeKey: 'raw-files',
      inputFiles: {},
      inputParameters: {},
    }
  }

  private clearRequest() {
    this.request = {
      projectId: this.projectState.selectedProject.id,
      typeKey: 'raw-files',
      inputFiles: {},
      inputParameters: {},
    }
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
  display: flex;
  flex-direction: row;
  min-height: 20rem;
}
.viz-details {
  padding-left: 30px;
}
.viz-files {
  display: flex;
  flex-direction: column;
}
.viz-file {
  padding: 5px 0px;
}
</style>

