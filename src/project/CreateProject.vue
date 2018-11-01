<template lang="pug">
  modal(v-on:close-requested="cancel()")
    span(slot="header") Create Project
    div(slot="content")
      text-input(label="Project Name" v-model="projectName")
      error(v-if="isServerError" v-bind:message="serverError")
    div(slot="actions")
      button.button.is-white.is-rounded(v-on:click="cancel()") Cancel
      button.button.is-success.is-rounded(v-on:click="handleCreateClicked()") Create
</template>

<script lang="ts">
import Vue from 'vue'
import FileAPI from '../communication/FileAPI'
import TextInput from '@/components/TextInput.vue'
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
export default Vue.extend({
  components: {
    'text-input': TextInput,
    error: Error,
    modal: Modal,
  },
  data() {
    return {
      projectName: '',
      isServerError: false,
      serverError: undefined,
      isRequesting: false,
    }
  },
  methods: {
    handleCreateClicked: async function() {
      try {
        this.isRequesting = true
        this.isServerError = false
        const newProject = await FileAPI.createProject(this.projectName)
        this.isRequesting = false
        this.$router.push({ path: `/project/${newProject.id}` })
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
        this.isRequesting = false
      }
    },
    cancel: function(): void {
      this.close()
    },
    close: function(): void {
      this.$emit('close')
    },
  },
})
</script>

<style scoped>
.createProject {
  display: flex;
  flex-direction: column;
  margin: 1rem;
}

.inputContainer {
  display: flex;
  flex-direction: column;
  margin: 1rem 0 1rem 0;
}

.inputLabel {
  font-size: 0.85rem;
  color: rgb(138, 138, 138);
}

.error {
  color: white;
  background-color: #ef5350;
  border-radius: 4px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  margin-bottom: 1rem;
}

.buttonContainer {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.loader {
  margin-right: 1rem;
}
</style>
