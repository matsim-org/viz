<template lang="pug">
modal(v-on:close-requested="cancel()")
    span(slot="header") Create Visualization
    div(slot="content")
      selection(v-bind:options="project.files" v-on:selection-changed="handleSelectionChanged")
        span(slot-scope="{ option }") {{ option.userFileName }}
      text-input(label="Pick a network file" v-model="foo")
      error(v-if="isServerError" v-bind:message="serverError")
    div(slot="actions")
        button.ui.negative.button(v-on:click="cancel()") Cancel
        button.ui.positive.button(v-on:click="createVisualization()") Create
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
import { CreateVisualizationRequest } from '../entities/Visualization'

interface CreateVisualizationState {
  isRequesting: boolean
  isServerError: boolean
  serverError: string
  foo?: string
  request?: CreateVisualizationRequest
  project?: Project
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
  data(): any {
    return {
      isRequesting: false,
      isServerError: false,
      serverError: '',
      foo: 'bar',
      request: {
        projectId: this.project.id,
        typeKey: 'raw-files',
        inputFiles: {},
        inputPrameters: {},
      },
    }
  },
  methods: {
    cancel: function() {
      this.close()
    },
    close: function() {
      this.$emit('close')
    },
    createVisualization: async function() {
      this.isRequesting = true
      try {
        let answer = await FileAPI.createVisualization({})
        this.close()
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
      } finally {
        this.isRequesting = false
      }
    },
    handleSelectionChanged: function(value: any) {
      console.log(value)
    },
  },
})
</script>

