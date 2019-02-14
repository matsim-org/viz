<template lang="pug">
modal(v-on:close-requested="close()")
    div(slot="header") Project Settings
    .contentWrapper(slot="content")
        .projectName
            .cuteBlueHeading Project Name
            .projectNameInput
              input.input(type="text" v-model="newProjectName" :class="{'is-danger': isProjectNameError}")
        .projectVisibility
            .cuteBlueHeading Project Visibility
            .visHolder
              p Public visualizations can be viewed by anybody on the web.
              .dropdown.is-right.right-align(:class="{'is-active': showVisibility}")
                .dropdown-trigger
                    button.button.is-rounded.left-space(@click="showVisibility = !showVisibility")
                        p.title-is-5 {{ chosenVisibility ? 'Private' : 'Public' }}
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
        button.button.negative.is-rounded(@click="cancel()") Cancel
        button.button.is-link.is-rounded.accent(@click="close()") Save
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Modal from '@/components/Modal.vue'
import Error from '@/components/Error.vue'
import ProjectStore, { ProjectVisibility } from '@/project/ProjectStore'
import ProjectViewModel from '@/project/Project.vue'

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
  private chosenVisibility!: ProjectVisibility

  public created() {
    const publicPermission = this.project.permissions.find(permission => permission.agent.authId === 'allUsers')
    this.chosenVisibility = publicPermission ? ProjectVisibility.Public : ProjectVisibility.Private
  }

  private close() {
    this.onProjectNameChanged()
    this.saveProjectVisibility()
    this.$emit('close')
  }

  private cancel() {
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

  private async saveProjectVisibility() {
    this.showVisibility = false
    try {
      await this.projectStore.changeVisibilityOfSelectedProject(this.chosenVisibility)
    } catch (error) {
      this.errorMessage = 'could not create public permission'
    }
  }

  private async onProjectVisibilityChanged(visibility: ProjectVisibility) {
    this.chosenVisibility = visibility
    this.showVisibility = false
  }
}
</script>

<style scoped>
.input {
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

.right-align {
  margin: 0rem 0.5rem 0rem auto;
}

.cuteBlueHeading {
  font-size: 1rem;
  font-weight: bold;
  color: #479ccc;
  min-width: max-content;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}
</style>