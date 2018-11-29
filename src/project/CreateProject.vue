<template lang="pug">
  modal(v-on:close-requested="cancel()")
    h3.title.is-3(slot="header") Create Project
    div(slot="content")
      input.input(v-model="projectName" placeholder="Project Name")
      error(v-if="isError" v-bind:message="errorMessage")
    div(slot="actions")
      button.button.is-white.is-rounded(v-on:click="cancel()") Cancel
      button.button.is-success.is-rounded(v-on:click="handleCreateClicked()") Create
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
</style>
