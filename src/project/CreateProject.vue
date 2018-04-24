<template lang="pug">
  .createProject
    h1 New Project
    span Create a new Project to collect result data. 
    .inputContainer
      label.inputLabel(for="inputProjectName") Project Name
      .ui.input
        input(
          v-model="projectName"
          name="inputProjectName" 
          type="text" 
          placeholder="Enter project name..." 
          required)
    .error(v-if="isServerError") {{serverError}}
    .buttonContainer
      
      button.ui.green.button(v-on:click="onCreateClicked")
        div.ui.active.inline.loader(v-if="isRequesting")
        span(v-else) Create
</template>

<script lang="ts">
import Vue from 'vue'
import FileAPI from '../communication/FileAPI'
export default Vue.extend({
  data() {
    return {
      projectName: '',
      isServerError: false,
      serverError: undefined,
      isRequesting: false,
    }
  },
  methods: {
    onCreateClicked: async function() {
      try {
        this.isRequesting = true
        this.isServerError = false
        let newProject = await FileAPI.createProject(this.projectName)
        this.isRequesting = false
        this.$router.replace({ path: `/project/${newProject.id}` })
      } catch (error) {
        this.isServerError = true
        this.serverError = error.message
        this.isRequesting = false
      }
    },
  },
})
</script>

<style>
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
</style>


