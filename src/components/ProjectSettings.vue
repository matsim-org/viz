<template lang="pug">
#container
  .cuteBlueHeading: h1 Sharing and Visibility

  B THIS DOES NOT WORK YET! DON'T PUT ANYTHING SENSITIVE ON THE DEV SITE !!!
  hr

  .field
    .control: label.radio
        input(type="radio" name="question" checked)
        b &nbsp;Private&nbsp;
        | (only me)
  .field
    .control: label.radio
        input(type="radio" name="question")
        b &nbsp;Public&nbsp;
        | (anyone on the web)
  .field
    .control: label.radio
        input(type="radio" name="question")
        b &nbsp;Share with:


  table.table.indent
    tbody
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
      tr
        td: b +Add
        td: .buttons.has-addons
              .button.is-small.is-static View Only
              .button.is-small.is-static Write/Modify
        td

</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import CloudAPI, { VizAttributes } from '@/communication/FireBaseAPI'
import Error from '@/components/Error.vue'
import FileAPI from '@/communication/FileAPI'
import { PermissionType } from '@/entities/Entities'

@Component({ components: { error: Error } })
export default class ProjectSettings extends Vue {
  private errorMessage = ''
  private isFetching = false
  private shareList: any = [{ name: 'billyc', perm: PermissionType.Read }, { name: 'vsp', perm: PermissionType.Write }]

  private permRead = PermissionType.Read
  private permWrite = PermissionType.Write

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

  private created() {}

  private async handleCreateClicked() {
    // then create it
    try {
      // tell calling component what user decided
      // this.close(this.startPageButtonState)
    } catch (error) {
      console.log({ error })
      this.errorMessage = '' + error
    } finally {
      this.isFetching = false
    }
  }

  private setStart(action: boolean) {
    // this.startPageButtonState = action
  }

  private cancel() {}

  private close(answer: boolean) {}
}
</script>

<style scoped>
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
  margin-top: 1rem;
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

.indent {
  margin-left: 3rem;
  background-color: #eee;
  border-radius: 5px;
}
</style>
