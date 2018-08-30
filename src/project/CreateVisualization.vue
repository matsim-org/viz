<template lang="pug">
modal(v-on:close-requested="cancel()")
    span(slot="header") Create Visualization
    div(slot="content")
      selection.selection(v-bind:options="sharedState.visualizationTypes"
                label="Select Visualization-Type"
                v-on:selection-changed="handleVizTypeChanged")
        span(slot-scope="{option}") {{ option.typeName }}
      div(v-if="selectedVizType")
        div(v-for="key in selectedVizType.requiredFileKeys")
          selection.selection(v-bind:options="project.files"
                            v-bind:label="key"
                            v-on:selection-changed="handleFileChanged(key, $event)")
            span(slot-scope="{option}") {{ option.userFileName }}

        div(v-for="key in selectedVizType.requiredParamKeys")
          text-input(v-bind:label="key" v-on:change="handleParamChanged(key, $event)")
      error(v-if="isServerError" v-bind:message="serverError")
    div(slot="actions")
        div(v-if="isRequesting")
          .ui.active.small.inline.loader
        div(v-else)
          button.ui.negative.button(v-on:click="cancel()") Cancel
          button.ui.positive.button(v-on:click="createVisualization()") Create
</template>

<style scoped>
.selection {
  margin-bottom: 1rem;
}
</style>

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
  isRequesting: boolean
  isServerError: boolean
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
      isRequesting: false,
      isServerError: false,
      serverError: '',
      request: {
        projectId: this.project.id,
        typeKey: 'raw-files',
        inputFiles: {},
        inputParameters: {},
      },
      sharedState: SharedStore.state,
      selectedVizType: undefined,
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
        if (answer.type.requiresProcessing && answer.type.endpoint) {
          triggerVizGeneration(answer.type.endpoint.toString(), answer.id)
        }
        this.close(answer)
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
      } finally {
        this.isRequesting = false
      }
    },
    handleVizTypeChanged: function(value: VisualizationType) {
      this.request.typeKey = value.typeName
      this.selectedVizType = value
    },
    handleFileChanged(key: string, event: any) {
      this.request.inputFiles[key] = event.id
    },
    handleParamChanged(key: string, value: string) {
      this.request.inputParameters[key] = value
    },
  },
})
</script>
