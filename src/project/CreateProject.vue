<template lang="pug">
  .createProject
    h1 New Project
    span Create a new Project to collect result data. 
      text-input(label="Project Name" v-model="projectName")
    error(v-if="isServerError" v-bind:message="serverError")
    .buttonContainer
      .loader
        .ui.active.inline.loader(v-if="isRequesting")
      button.ui.animated.positive.button(v-on:click="onCreateClicked")
        .ui.visible.content Create
        .ui.hidden.content
          i.ui.check.icon
</template>

<script lang="ts">
import Vue from 'vue'
import FileAPI from '../communication/FileAPI'
import TextInput from '@/components/TextInput.vue'
import Error from '@/components/Error.vue'
export default Vue.extend({
  components: {
    'text-input': TextInput,
    error: Error,
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

.loader {
  margin-right: 1rem;
}
</style>


