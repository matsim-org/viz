<template lang="pug">
modal(v-on:close-requested="close()")
    .header(slot="header")
        p.title.less-margin-top Project Settings

    .contentWrapper(slot="content")
        .projectName
            p.title.is-4 Project Name
            .projectNameInput
              input.input(type="text" v-model="newProjectName" :class="{'is-danger': isProjectNameError}")
        .projectVisibility
            p.title.is-4 Project Visibility
            .visHolder
              p.subtitle.is-5 Public visualizations can be viewed by anybody on the web.
              .dropdown.is-right(:class="{'is-active': showVisibility}")
                .dropdown-trigger
                    button.button.is-medium.is-rounded.left-space(@click="showVisibility = !showVisibility")
                        p.title-is-5 {{ visibility }}
                        span.icon.is-small
                            i.fas.fa-angle-down
                .dropdown-menu(role="menu")
                    .dropdown-content
                        a.dropdown-item.fixed-width(@click="onProjectVisibilityChanged(0)")
                            p.title.is-6 Public
                        a.dropdown-item.fixed-width(@click="onProjectVisibilityChanged(1)")
                            p.title.is-6 Private
        error(v-if="errorMessage.length > 0" v-bind:message="errorMessage")

    .actions(slot="actions")
        button.button.is-link.is-rounded.is-medium.accent(@click="close()") Close
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '@/components/Modal.vue'
import Error from '@/components/Error.vue'
import ProjectStore, { ProjectVisibility } from '@/project/ProjectStore'

@Component({
  components: {
    modal: Modal,
    error: Error,
  },
})
export default class ProjectSettings extends Vue {
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  private newProjectName = this.projectStore.State.selectedProject.name
  private isProjectNameError = false
  private errorMessage = ''
  private showVisibility = false

  private close() {
    this.onProjectNameChanged()
    this.$emit('close')
  }

  private get project() {
    return this.projectStore.State.selectedProject
  }

  private get visibility() {
    const publicPermission = this.project.permissions.find(permission => permission.agent.authId === 'allUsers')
    return publicPermission ? 'Public' : 'Private'
  }

  private async onProjectNameChanged() {
    try {
      await this.projectStore.changeNameOfSelectedProject(this.newProjectName)
      this.errorMessage = ''
      this.isProjectNameError = false
    } catch (error) {
      this.isProjectNameError = true
      this.errorMessage = 'Could not change project name. Try another.'
    }
  }

  private async onProjectVisibilityChanged(visibility: ProjectVisibility) {
    this.showVisibility = false
    try {
      await this.projectStore.changeVisibilityOfSelectedProject(visibility)
    } catch (error) {
      this.errorMessage = 'could not create public permission'
    }
  }
}
</script>

<style scoped>
.input {
  font-size: 1.25rem;
  margin-left: -0.5rem;
}

.contentWrapper {
  display: flex;
  flex-direction: column;
}

.projectNameInput {
  display: flex;
  flex-direction: row;
}

.projectVisibility {
  display: flex;
  flex-direction: column;
  margin-top: 2rem;
}

.accent {
  margin-left: 1rem;
  background-color: #2d76a1;
}

.accent:hover {
  background-color: #256083;
}

.visHolder {
  display: flex;
  flex-direction: row;
  padding-bottom: 5rem;
}
.left-space {
  margin-left: 1rem;
}

p.title {
  color: #479ccc;
  margin-bottom: 0.5rem;
}

p.title.less-margin-top {
  margin-bottom: 0rem;
}
</style>