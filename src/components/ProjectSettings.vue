<template lang="pug">
#container
  B PROJECT SETTINGS DO NOT WORK YET! DON'T PUT ANYTHING SENSITIVE ON THE DEV SITE !!!
  // p These settings affect every run, file, and visualization that is part of this project.

  .cuteBlueHeading: h1 Project Visibility

  .field
    .control: label.radio
        input(v-model="vizButton" value="Private" type="radio" name="vizButton" :chosen="vizButton==='Private'")
        b &nbsp;Private&nbsp;
        | (myself plus additional access below)
  .field
      .control: label.radio
        input(v-model="vizButton" value="Public" type="radio" name="vizButton" :chosen="vizButton==='Public'")
        b &nbsp;Public&nbsp;
        | (anyone on the web)

  .cuteBlueHeading: h1 User/Group Access Settings

  p Add additional access rights here.

  table.table.share-table
    tbody
      tr
        td: .field.has-addons
          .control.has-icons-left
            input.input.is-link.is-marginless(type="text" placeholder="Add user or group")
            .icon.is-small.is-left: i.fas.fa-users
          .control: a.button.is-link(disabled) Add
        td: .buttons.has-addons(style="margin-top: 4px")
            .button.is-small.is-static View Only
            .button.is-small.is-static Write/Modify

      tr(v-for="actor in shareList")
        td: b {{ actor.name }}
        td: .buttons.has-addons
              .button.is-small(
                :class="{'is-link': actor.perm === permRead, 'is-selected': actor.perm === permRead}"
                @click="actor.perm = permRead") View Only
              .button.is-small(
                :class="{'is-danger': actor.perm === permWrite, 'is-selected': actor.perm === permWrite}"
                @click="actor.perm = permWrite") Write/Modify
        td(style="vertical-align: center; margin-top: 0.5rem;"): .delete.is-danger(style="margin-top: 0.25rem;")

  hr
  .actions
    button.button.is-rounded.is-link.action-button(@click="clickedSave" :class="{'is-loading': isFetching}") Save
    button.button.is-rounded.is-text.action-button(@click="cancel") Cancel
  p.help.is-danger(v-if="errorMessage") {{ errorMessage }}

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import CloudAPI, { VizAttributes } from '@/communication/FireBaseAPI'
import Error from '@/components/Error.vue'
import FileAPI from '@/communication/FileAPI'
import ProjectStore, { ProjectVisibility } from '@/project/ProjectStore'
import { PermissionType } from '@/entities/Entities'

@Component({ components: { error: Error } })
export default class ProjectSettings extends Vue {
  private errorMessage = ''
  private isFetching = false
  private shareList: any = [{ name: 'billyc', perm: PermissionType.Read }, { name: 'vsp', perm: PermissionType.Write }]

  private permRead = PermissionType.Read
  private permWrite = PermissionType.Write

  private vizButton = 'Private'

  @Prop()
  private projectStore!: ProjectStore

  @Prop()
  private owner!: string

  @Prop()
  private projectId!: string

  @Prop()
  private fileApi!: FileAPI

  public static Close() {
    return 'close'
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private created() {
    this.vizButton = this.getPublicPermission()
  }

  private getPublicPermission() {
    const publicPermission = this.projectStore.State.selectedProject.permissions.find(
      permission => permission.agent.authId === 'allUsers'
    )
    return publicPermission ? 'Public' : 'Private'
  }

  private async clickedSave() {
    console.log('saving project settings', this.vizButton)
    try {
      this.isFetching = true
      this.errorMessage = ''
      await this.projectStore.changeVisibilityOfSelectedProject(
        this.vizButton === 'Public' ? ProjectVisibility.Public : ProjectVisibility.Private
      )
      this.close()
    } catch (error) {
      console.log({ MUGWUMP: error })
      this.errorMessage = '' + error
    } finally {
      this.isFetching = false
    }
  }

  private cancel() {
    this.close()
  }

  private close() {
    this.$emit('close')
  }
}
</script>

<style scoped>
#container {
  border: solid 1px #ccf;
  padding: 1rem 1rem;
  border-radius: 4px;
  background-color: #fafafa;
  margin-bottom: 4rem;
}

h4.title {
  color: #479ccc;
  text-transform: uppercase;
}

.accent {
  background-color: #2d76a1;
  color: white;
}

.accent:hover {
  background-color: #256083;
}

.cuteBlueHeading h1 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #479ccc;
  min-width: max-content;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}

.input {
  margin-top: 1rem;
}

.actions {
  display: flex;
  flex-direction: row;
  margin-left: auto;
}

.share-table {
  background-color: #e8e8e8;
  border-radius: 5px;
}
</style>
