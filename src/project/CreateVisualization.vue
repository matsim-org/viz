<template lang="pug">
modal(v-on:close-requested="cancel()")
    span(slot="header")
      h3 Create Visualization

    div(slot="content")
      .viz-selector
        aside.menu
          p.menu-label Select:
          ul.menu-list
            li(v-for="viz in Array.from(sharedState.visualizationTypes.values())")
              a(:class="{'is-active': selectedVizType && viz.typeName==selectedVizType.typeName}" @click="handleVizTypeChanged(viz)") {{viz.prettyName}}
        .viz-details(v-if="selectedVizType" )
          h3 {{selectedVizType.prettyName}}
          p(v-if="selectedVizType.description") {{selectedVizType.description}}
          br
          .viz-files(v-for="key in selectedVizType.requiredFileKeys")
            .viz-file
              b {{key}}
              .dropdown.is-right(style="float:right;" :class="{'is-active': openDropdown==key}")
                .dropdown-trigger
                  button.button.is-small(@click="toggleDropdown(key)" aria-haspopup="true" aria-controls="dropdown-menu")
                    span {{ request.inputFiles[key] ? fileLookup[key] : 'Choose&hellip;' }}
                    span.icon.is-small
                      i.fas.fa-angle-down(aria-hidden="true")
                .dropdown-menu(:id="'dropdown-menu'+key" role="menu")
                  .dropdown-content
                    a.dropdown-item(v-for="file in project.files" @click='handleFileChanged(key, file)') {{file.userFileName}}

          .viz-parameters(v-for="key in selectedVizType.requiredParamKeys")
            .viz-file
              b {{key}}
              input.input(placeholder="Required" style="float:right;")

    div(slot="actions")
      .bottom-panel
        div(v-if="isRequesting")
          .ui.active.small.inline.loader
        div(v-else)
          button.ui.negative.button(v-on:click="cancel()") Cancel
          button.button.is-link(v-on:click="createVisualization()") Create
</template>

<script lang="ts">
import Vue from 'vue'
import TextInput from '@/components/TextInput.vue'
import Modal from '@/components/Modal.vue'
import Error from '@/components/Error.vue'
import Selection from '@/components/Selection.vue'
import { setTimeout } from 'timers'
import FileAPI from '../communication/FileAPI'
import Project from '../entities/Project'
import { Visualization } from '../entities/Visualization'
import { CreateVisualizationRequest, VisualizationType } from '../entities/Visualization'
import SharedStore, { SharedState } from '../SharedStore'

interface CreateVisualizationState {
  fileLookup: any
  isRequesting: boolean
  isServerError: boolean
  isVizListOpen: boolean
  openDropdown: string
  serverError: string
  request: CreateVisualizationRequest
  project?: Project
  sharedState: SharedState
  selectedVizType?: VisualizationType
}

async function triggerVizGeneration(endpoint: string, vizId: string) {
  await fetch(endpoint + '/' + vizId, {
    mode: 'cors',
    method: 'PUT',
  })
}

export default Vue.extend({
  components: {
    modal: Modal,
    'text-input': TextInput,
    error: Error,
    selection: Selection,
  },
  props: {
    project: Object,
  },
  data(): CreateVisualizationState {
    return {
      isVizListOpen: false,
      isRequesting: false,
      isServerError: false,
      openDropdown: '',
      serverError: '',
      request: {
        projectId: this.project.id,
        typeKey: 'raw-files',
        inputFiles: {},
        inputParameters: {},
      },
      sharedState: SharedStore.state,
      selectedVizType: undefined,
      fileLookup: {},
    }
  },
  methods: {
    cancel: function(): void {
      this.close(null)
    },
    close: function(visualization: Visualization | null): void {
      this.$emit('close', visualization)
    },
    createVisualization: async function(): Promise<void> {
      this.isRequesting = true
      try {
        const answer = await FileAPI.createVisualization(this.request)
        this.close(answer)
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
      } finally {
        this.isRequesting = false
      }
    },
    handleToggleVizList: function() {
      this.isVizListOpen = !this.isVizListOpen
    },
    handleVizTypeChanged: function(value: VisualizationType) {
      console.log(value)
      this.request.typeKey = value.typeName
      this.selectedVizType = value
    },
    handleFileChanged(key: string, event: any) {
      this.request.inputFiles[key] = event.id
      this.fileLookup[key] = event.userFileName
      this.toggleDropdown('')
    },
    handleParamChanged(key: string, value: string) {
      this.request.inputParameters[key] = value
    },
    toggleDropdown(key: string) {
      if (this.openDropdown === key) this.openDropdown = ''
      else this.openDropdown = key
    },
  },
})
</script>
<style scoped>
.selection {
  margin-bottom: 1rem;
}
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

