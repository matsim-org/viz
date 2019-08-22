<template lang="pug">
#container
  p
    b PROJECT SETTINGS.&nbsp;
    | These settings affect every run, file, and visualization that is part of this project.

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
        td: .control: .select.is-small
          select(v-model="addUserName")
            option(disabled value="") Select...
            option(v-for="user in usersWhoCanBeAdded") {{ user.username }}
        td: .buttons.has-addons
            .button.is-small(
                @click="addUserPerm = permRead"
                :class="{'is-static': disableAddButton, 'is-selected': addUserPerm === permRead, 'is-link': addUserPerm === permRead}")
                | View Only
            .button.is-small(
                @click="addUserPerm = permWrite"
                :class="{'is-static': disableAddButton, 'is-selected': addUserPerm === permWrite, 'is-danger': addUserPerm === permWrite}")
                | Write/Modify
        td: .control: a.button.is-link.is-small(:disabled="disableAddButton" @click="clickedAdd") Add

      tr(v-for="actor in shareList.filter(f => !f.markedForDeletion)" :key="actor.authId")
        td: b {{ actor.name }}
        td: .buttons.has-addons
              .button.is-small(
                :class="{'is-link': actor.perm === permRead, 'is-selected': actor.perm === permRead}"
                @click="actor.perm = permRead") View Only
              .button.is-small(
                :class="{'is-danger': actor.perm === permWrite, 'is-selected': actor.perm === permWrite}"
                @click="actor.perm = permWrite") Write/Modify
        td(style="vertical-align: center; margin-top: 0.5rem;")
            .delete.is-pulled-right.is-danger(@click="clickedRemove(actor)" style="margin-top: 0.25rem;")

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
import AuthenticationStore from '../auth/AuthenticationStore'

interface UserAccess {
  authId: string
  name: string
  perm: PermissionType
  markedForDeletion?: boolean
}

@Component({ components: { error: Error } })
export default class ProjectSettings extends Vue {
  private errorMessage = ''
  private isFetching = false
  private shareList: UserAccess[] = []

  private permRead = PermissionType.Read
  private permWrite = PermissionType.Owner
  private vizButton = 'Private'

  private systemUsersByName: any = {}
  private systemUsersByAuthId: any = {}
  private addUserName: string = ''
  private addUserPerm = PermissionType.Read
  private disableAddButton = true
  private usersWhoCanBeAdded: UserAccess[] = []

  @Prop()
  private projectStore!: ProjectStore

  @Prop()
  private authStore!: AuthenticationStore

  @Prop()
  private owner!: string

  @Prop()
  private projectId!: string

  @Prop()
  private fileApi!: FileAPI

  public static Close() {
    return 'close'
  }

  @Watch('addUserName')
  private userNameChanged() {
    this.disableAddButton = this.addUserName ? false : true
  }

  private clickedAdd() {
    console.log('clicked add', this.addUserName, this.addUserPerm)

    const newACL: UserAccess = {
      name: this.addUserName,
      authId: this.systemUsersByName[this.addUserName].uid,
      perm: this.addUserPerm,
    }

    this.shareList.push(newACL)
    this.shareList.sort((a, b) => (a.name < b.name ? -1 : 1))

    // clear the add box
    this.addUserName = ''
    this.updateUsersWhoCanBeAdded()
  }

  private clickedRemove(user: any) {
    const toRemove = this.shareList.find(f => f.name === user.name)
    if (toRemove) toRemove.markedForDeletion = true
    this.updateUsersWhoCanBeAdded()

    console.log('removed ', user.name)
    console.log(this.shareList)
  }

  private updateUsersWhoCanBeAdded() {
    const myList = []
    const currentNameList: any = {}
    for (const user of this.shareList) {
      if (!user.markedForDeletion) currentNameList[user.name] = true
    }
    console.log(currentNameList)

    for (const user of Object.values(this.systemUsersByName) as any) {
      console.log(user)
      if (user.uid === this.authStore.state.idToken.sub) continue
      if (currentNameList[user.username] && !currentNameList[user.username].markedForDeletion) continue
      myList.push(user)
    }
    this.usersWhoCanBeAdded = myList
  }

  private get accessTable() {
    console.log('boop')
    return this.shareList.filter(f => !f.markedForDeletion)
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private async created() {
    this.vizButton = this.getPublicPermission()
    await this.getSystemUsers()
    await this.processCurrentPermissions()
    this.updateUsersWhoCanBeAdded()
  }

  private async processCurrentPermissions() {
    const permissions: any = this.projectStore.State.selectedProject.permissions
    for (const permission of permissions) {
      const authId = permission.agent.authId
      console.log({ agent: authId, type: permission.type, owner: permission.owner })
      // system stuff handled elsewhere
      if (authId === 'allUsers') continue
      if (authId === 'allServices') continue
      // cannot remove myself
      if (authId === this.authStore.state.idToken.sub) continue

      if (this.systemUsersByAuthId[authId]) {
        this.shareList.push({ authId, perm: permission.type, name: this.systemUsersByAuthId[authId].username })
      }
    }
  }

  private async getSystemUsers() {
    const users = await CloudAPI.getOwners()
    for (const user of users) {
      this.systemUsersByAuthId[user.uid] = user
      this.systemUsersByName[user.username] = user
    }
    console.log({ sysusers: this.systemUsersByAuthId })
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

      // save project visibility
      await this.projectStore.changeVisibilityOfSelectedProject(
        this.vizButton === 'Public' ? ProjectVisibility.Public : ProjectVisibility.Private
      )

      // save access list
      for (const acl of this.shareList) {
        console.log(acl)
        if (acl.markedForDeletion) {
          await this.projectStore.removePermissionForUser(acl.authId)
        } else {
          await this.projectStore.setPermissionForUser(acl.authId, acl.perm)
        }
      }

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
