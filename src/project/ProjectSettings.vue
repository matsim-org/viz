<template lang="pug">
modal(v-on:close-requested="close()")
    .header(slot="header")
        p.title Settings
    
    .contentWrapper(slot="content")
        .projectName
            p.title.is-4 Project Name
            .projectNameInput    
                input.input(type="text" v-model="newProjectName" :class="{'is-danger': isProjectNameError}")
                button.button.is-link(@click="onProjectNameChanged") Save
        .projectVisibility
            p.title.is-4 Project Visibility
            p.subtitle.is-6 If set to public, all visualizations can be viewed by anybody. The Project can only be changed by yourself
            .dropdown.less-margin-top(:class="{'is-active': showVisibility}")
                .dropdown-trigger
                    button.button(@click="showVisibility = !showVisibility")
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
        button.button.is-link(@click="close()") Close
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
.contentWrapper {
  display: flex;
  flex-direction: column;
  min-height: 20rem;
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

.less-margin-top {
  margin-top: -1rem;
}
</style>