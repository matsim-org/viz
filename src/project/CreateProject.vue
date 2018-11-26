<template lang="pug">
  modal(v-on:close-requested="cancel()")
    h3.title.is-3(slot="header") Create Project
    div(slot="content")
      text-input(label="Project Name" v-model="projectName")
      error(v-if="isError" v-bind:message="errorMessage")
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
import TextInputVue from '@/components/TextInput.vue'
import ProjectStore from '@/project/ProjectStore'
import Component from 'vue-class-component'

const vueInstance = Vue.extend({
  components: {
    'text-input': TextInput,
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
