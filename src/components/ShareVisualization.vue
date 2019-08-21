<template lang="pug">
  modal(v-on:close-requested="cancel()")
    div(slot="header") Share Visualization
    div(slot="content")
      p Choose who can see this visualization.

      .cuteBlueHeading: h1 Show on Start Page

      .buttons.has-addons
        .button(
          :class="{'is-link':!startPageButtonState, 'is-selected':!startPageButtonState}"
          @click="setStart(false)") No
        .button(
          :class="{'is-link':startPageButtonState, 'is-selected':startPageButtonState}"
          @click="setStart(true)") Yes

      p More sharing options to come.

      error(v-if="isError" v-bind:message="errorMessage")

    .actions(slot="actions")
      button.button.negative.is-rounded(v-if="!isFetching" @click="cancel") Cancel
      button.button.is-rounded.accent(
        :class="{'is-loading':isFetching}"
        @click="handleCreateClicked()") Save
</template>

<script lang="ts">
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import CloudAPI, { VizAttributes } from '@/communication/FireBaseAPI'
import FileAPI from '../communication/FileAPI'

@Component({ components: { error: Error, modal: Modal } })
export default class ShareVisualization extends Vue {
  private errorMessage = ''
  private startPageButtonState = false
  private isFetching = false

  @Prop()
  private owner!: string

  @Prop()
  private projectId!: string

  @Prop()
  private run!: string

  @Prop()
  private viz!: VizAttributes

  @Prop()
  private fileApi!: FileAPI

  public static Close() {
    return 'close'
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private created() {
    this.startPageButtonState = this.viz.startPage ? true : false
  }

  private async handleCreateClicked() {
    // then create it
    try {
      this.isFetching = true
      const location = `users/${this.owner}/projects/${this.projectId}/runs/${this.run}/visualizations/${this.viz.id}`
      await CloudAPI.updateDoc(location, { startPage: this.startPageButtonState })
      // tell calling component what user decided
      this.close(this.startPageButtonState)
    } catch (error) {
      console.log({ error })
      this.errorMessage = '' + error
    } finally {
      this.isFetching = false
    }
  }

  private setStart(action: boolean) {
    this.startPageButtonState = action
  }

  private cancel() {
    // send back the original setting
    this.close(this.viz.startPage ? true : false)
  }

  private close(answer: boolean) {
    this.$emit('close', answer)
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
</style>
