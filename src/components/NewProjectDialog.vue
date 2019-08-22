<template lang="pug">
  modal(v-on:close-requested="cancel()")
    div(slot="header") Create New Project
    div(slot="content")
      p Projects organize your runs, dashboards, and visualizations.

      .cuteBlueHeading: h1 Short name
      input.input.is-medium(v-model="projectShortName" placeholder="trafficsim"
                            v-focus
                            @keyup.esc="cancel")
      p used in URLs: no ödd characters!

      .cuteBlueHeading: h1 Project Title
      input.input.is-medium(v-model="projectName" placeholder="Traffic Simulation"
                            @keyup.esc="cancel")
      p e.g., study name, city, sponsor, etc.

      .cuteBlueHeading: h1 Description
      input.input.is-medium(v-model="projectDescription" placeholder="Description"
                            @keyup.esc="cancel")
      error(v-if="isError" v-bind:message="errorMessage")

    .actions(slot="actions")
      p.pathHint Path:
        b &nbsp;/{{owner}}/{{ cleanUrlSlug }}
      button.button.negative.is-rounded(v-on:click="cancel()") Cancel
      button.button.is-rounded.accent(
        @click="handleCreateClicked()"
        :disabled="!projectName || !projectShortName"
        :class="{'is-success': projectName && projectShortName}"
        ) Create
</template>

<script lang="ts">
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import CloudAPI, { OwnerAttributes } from '@/communication/FireBaseAPI'
import ProjectStore from '../project/ProjectStore'
import { PermissionType } from '../entities/Entities'

@Component({ components: { error: Error, modal: Modal } })
export default class NewProjectDialog extends Vue {
  @Prop()
  private owner!: string
  @Prop()
  private ownerDetails!: OwnerAttributes
  @Prop()
  private projectStore!: ProjectStore

  private projectName = ''
  private projectShortName = ''
  private projectDescription = ''
  private errorMessage = ''

  private get cleanUrlSlug() {
    return this.projectShortName.replace(/[\W_]+/g, '-').toLowerCase()
  }

  public static Close() {
    return 'close'
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private async handleCreateClicked() {
    // clean the url-slug
    this.projectShortName = this.cleanUrlSlug

    // make sure project doesn't already exist
    const exists = await CloudAPI.getProject(this.owner, this.projectShortName)
    if (exists) {
      this.errorMessage = `Project ${this.owner}/${this.projectShortName} already exists. Choose a different short name.`
      return
    }

    try {
      // create project on fileserver
      const fileServerProject = await this.projectStore.createProject(this.projectName)

      // create it on cloudserver
      CloudAPI.createProject({
        owner: this.owner,
        title: this.projectName,
        urlslug: this.projectShortName,
        description: this.projectDescription,
        notes: '',
        mvizkey: fileServerProject.id,
      })

      // give everyone in the group access to it
      if (this.ownerDetails.members) {
        await this.projectStore.selectProject(fileServerProject.id)
        const owners = await CloudAPI.getOwners()

        const promises = []
        for (const userName of this.ownerDetails.members) {
          const owner = owners.find(f => f.username === userName)
          if (owner) promises.push(this.projectStore.setPermissionForUser(owner.uid, PermissionType.Owner))
        }
        await Promise.all(promises)
      }

      this.close()
    } catch (error) {
      console.log({ error })
      this.errorMessage = 'Error creating project: ' + error
    }
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }

  @Watch('projectShortName')
  private checkShortName() {
    this.errorMessage = ''
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #479ccc;
  min-width: max-content;
  margin-top: 1rem;
  margin-bottom: -1rem;
}

.input {
  margin-top: 1rem;
}

.actions {
  width: 100%;
  display: flex;
  flex-direction: row;
}

.pathHint {
  margin-right: auto;
}
</style>
