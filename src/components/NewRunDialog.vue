<template lang="pug">
  modal(v-on:close-requested="cancel()")
    div(slot="header") New Run
    div(slot="content")
      p Runs organize your files and visualizations

      .cuteBlueHeading: h1 Run id/name/number
      input.input.is-medium(v-model="runId" placeholder="run001"
                            v-focus
                            @keyup.esc="cancel")
      p used in URLs: no accents or special characters

      .cuteBlueHeading: h1 Description
      input.input.is-medium(v-model="runDescription" placeholder="Description"
                            @keyup.esc="cancel")

      error(v-if="isError" v-bind:message="errorMessage")

    .actions(slot="actions")
      p.pathHint Path:
        b &nbsp;/{{ owner }}/{{ projectId }}/{{ cleanUrlSlug }}
      button.button.negative.is-rounded(v-on:click="cancel") Cancel
      button.button.is-rounded.accent(
        @click="handleCreateClicked()"
        :disabled="!runId"
        :class="{'is-success': runId}"
        ) Create
</template>

<script lang="ts">
import Error from '@/components/Error.vue'
import Modal from '@/components/Modal.vue'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import CloudAPI from '@/communication/FireBaseAPI'
import FileAPI from '../communication/FileAPI'

const vueInstance = Vue.extend({
  components: {
    error: Error,
    modal: Modal,
  },
  props: { owner: String, projectId: String, mvizkey: String, fileApi: FileAPI },
})

@Component
export default class NewRunDialog extends vueInstance {
  private runId = ''
  private runDescription = ''
  private errorMessage = ''

  private get cleanUrlSlug() {
    return this.runId.replace(/[\W_]+/g, '-').toLowerCase()
  }

  public static Close() {
    return 'close'
  }

  private get isError() {
    return this.errorMessage && this.errorMessage.length !== 0
  }

  private async handleCreateClicked() {
    // clean the url-slug
    this.runId = this.cleanUrlSlug

    // make sure run doesn't already exist
    const exists = await CloudAPI.getRun(this.owner, this.projectId, this.runId)
    if (exists) {
      this.errorMessage = `Run ${this.owner}/${this.projectId}/${this.runId} already exists. Try a different name.`
      return
    }

    // then create it
    try {
      await this.fileApi.createTag({ name: this.runId, type: 'run' }, this.mvizkey)

      await CloudAPI.createRun({
        owner: this.owner,
        project: this.projectId,
        runId: this.runId,
        description: this.runDescription,
        notes: '',
      })

      this.close()
    } catch (error) {
      console.log({ error })
      this.errorMessage = 'Could not create run: ' + error
      return
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
