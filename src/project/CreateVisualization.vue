<template lang="pug">
modal(v-on:close-requested="cancel()")
    span(slot="header") Create Visualization
    div(slot="content")
      selection.selection(v-bind:options="visualizationTypes" 
                label="Select Visualization-Type" 
                v-on:selection-changed="handleVizTypeChanged")
        span(slot-scope="{option}") {{ option }}

      selection.selection(v-bind:options="project.files"
                label="Select network"
                v-on:selection-changed="handleNetworkFileChanged")
        span(slot-scope="{ option }") {{ option.userFileName }}

      selection.selection(v-bind:options="project.files"
                label="Select events"
                v-on:selection-changed="handleEventsFileChanged")
        span(slot-scope="{ option }") {{ option.userFileName }}

      selection.selection(v-bind:options="project.files"
                label="Select plans"
                v-on:selection-changed="handlePlansFileChanged")
        span(slot-scope="{ option }") {{ option.userFileName }}

      text-input(label="Snapshot Intervall" v-on:change="handleSnapshotIntervallChanged")
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
import { CreateVisualizationRequest } from '../entities/Visualization'

interface CreateVisualizationState {
  isRequesting: boolean
  isServerError: boolean
  serverError: string
  request: CreateVisualizationRequest
  project?: Project
  visualizationTypes?: String[]
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
      visualizationTypes: ['Network-Flows', 'Accessibility', 'Network Links', 'Animation'],
      request: {
        projectId: this.project.id,
        typeKey: 'raw-files',
        inputFiles: new Map<string, string>(),
        inputParameters: new Map<string, string>(),
      },
    }
  },
  methods: {
    cancel: function(): void {
      this.close()
    },
    close: function(): void {
      this.$emit('close')
    },
    createVisualization: async function(): Promise<void> {
      this.isRequesting = true
      try {
        let answer = await FileAPI.createVisualization(this.request)
        this.close()
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
      } finally {
        this.isRequesting = false
      }
    },
    handleVizTypeChanged: function(value: string) {
      this.request.typeKey = value
    },
    handleNetworkFileChanged: function(value: any) {
      this.request.inputFiles.set('network', value.id)
    },
    handleEventsFileChanged: function(value: any) {
      this.request.inputFiles.set('events', value.id)
    },
    handlePlansFileChanged: function(value: any) {
      this.request.inputFiles.set('plans', value.id)
    },
    handleSnapshotIntervallChanged: function(value: string) {
      this.request.inputParameters.set('snapshotIntervall', value)
    },
  },
})
</script>

