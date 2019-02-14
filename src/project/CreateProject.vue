<template lang="pug">
  modal(v-on:close-requested="cancel()")
    div(slot="header") Create Project
    div(slot="content")
      .cuteBlueHeading: h1 Enter project name
      p (e.g., city, sponsor, etc.)
      input.input.is-medium(v-model="projectName" placeholder="Project Name")
      error(v-if="isError" v-bind:message="errorMessage")
    div(slot="actions")
      button.button.negative.is-rounded(v-on:click="cancel()") Cancel
      button.button.is-success.is-rounded.accent(v-on:click="handleCreateClicked()") Create
</template>

<script lang="ts">
import Vue from 'vue'
import FileAPI from '../communication/FileAPI'
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
import ProjectStore from '@/project/ProjectStore'
import Component from 'vue-class-component'

const vueInstance = Vue.extend({
  components: {
    error: Error,
    modal: Modal,
  },
  props: {
    projectStore: ProjectStore,
  },
})

@Component
export default class CreateProjectViewModel extends vueInstance {
  private projectName = ''
  private errorMessage = ''

  public static Close() {
    return 'close'
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private async handleCreateClicked() {
    try {
      const newProject = await this.projectStore.createProject(this.projectName)
      this.$router.push({ path: `/project/${newProject.id}` })
    } catch (error) {
      this.errorMessage = 'Uh oh, Could not create project.'
    }
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit(CreateProjectViewModel.Close())
  }
}
</script>

<style scoped>
h4.title {
  color: #479ccc;
  text-transform: uppercase;
}

.accent {
  background-color: #2d76a1;
}

.accent:hover {
  background-color: #256083;
}

.cuteBlueHeading h1 {
  font-size: 1.4rem;
  color: #479ccc;
  min-width: max-content;
  margin-top: 0.5rem;
}

.input {
  margin-top: 1rem;
}
</style>
