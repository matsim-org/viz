<template lang="pug">
  modal(v-on:close-requested="cancel()")
    div(slot="header") Create Project
    div(slot="content")
      .cuteBlueHeading: h1 Enter project name
      p (e.g., city, sponsor, etc.)
      input.input.is-medium(v-model="projectName" placeholder="Project Name"
                            v-focus
                            @keyup.enter="handleCreateClicked()"
                            @keyup.esc="cancel()")
      error(v-if="isError" v-bind:message="errorMessage")
    div(slot="actions")
      button.button.negative(v-on:click="cancel()") Cancel
      button.button.is-success.accent(v-on:click="handleCreateClicked()") Create
</template>

<script lang="ts">
import FileAPI from '../communication/FileAPI'
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
import ProjectStore from '@/project/ProjectStore'
import { Vue, Prop, Component, Watch } from 'vue-property-decorator'

@Component({
  components: {
    modal: Modal,
    error: Error,
  },
})
export default class CreateProjectViewModel extends Vue {
  @Prop()
  private projectStore!: ProjectStore

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
      this.close()
      // this.$router.push({ path: `/project/${newProject.id}` })
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
