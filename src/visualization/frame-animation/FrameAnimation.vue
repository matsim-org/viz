<template lang="pug">
    .frameAnimation
      .header
        h1.title Frame Based Animation
        h5.subtitle Id: {{vizId}}
      .canvasContainer
        .loaderContainer(v-if="isFailed")
          span Generating Visualization failed! Check your input files.
        .loaderContainer(v-if="!isDone && !isFailed")
          spinner
          span Server is processing files...
        .loaderContainer(v-if="!connected")
          spinner
          span Connecting to server...
        canvas.canvas(ref="canvas" id="canvas")
      .controls
        input.range(type="range" 
                    v-bind:min="firstTimestep" 
                    v-bind:max="lastTimestep" 
                    v-bind:step="timestepSize" 
                    v-bind:value="currentTimestep" 
                    v-on:input="onRangeChanged($event)" 
                    v-on:mousedown="onRangeMouseDown($event)"
                    v-on:mouseup="onRangeMouseUp($event)")
        .actions
          .bufferState
            spinner(v-if="isFetchingData")
          .inputWithLabel
            label.content.is-small(for="speedInput") Playpack speed
            .speedControls
              button.button(v-on:click="changeSpeedFactor(-0.1)")
                span.icon.is-small
                  i.fas.fa-minus
              input.input.speedInput(name="speedInput" readonly v-model="speedFactor")
              button.button(v-on:click="changeSpeedFactor(0.1)")
                span.icon.is-small
                  i.fas.fa-plus
          .inputWithLabel
            label.content.is-small(for="timestepInput") Time
            input.input(type="text" readonly v-model="currentTime")
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import Webvis from './Webvis'
import Config from '../../config/Config'
import { Progress } from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import SharedStore from '@/SharedStore'
import { Visualization } from '@/entities/Entities'
import ProjectStore from '@/project/ProjectStore'
import Spinner from '@/components/Spinner.vue'

// register frame animation with shared store
SharedStore.addVisualizationType({
  typeName: 'frame-animation',
  prettyName: 'Frame Animation',
  requiredFileKeys: ['events', 'network', 'plans'],
  requiredParamKeys: ['snapshotInterval'],
})

@Component({
  components: {
    spinner: Spinner,
  },
})
export default class FrameAnimation extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string
  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  private isPlaying = false
  private isFetchingData = false
  private isRangeMouseDown = false
  private firstTimestep = 0
  private lastTimestep = 1
  private currentTimestep = 0
  private timestepSize = 1
  private playbackSpeedFactor = 0
  private progress = 'Done'
  private connected = false
  private webvis: any // convert webvis wrapper to ts to make this more specific

  private get currentTime() {
    return new Date(this.currentTimestep * 1000).toISOString().substr(11, 8)
  }

  private get speedFactor() {
    return Math.round(this.playbackSpeedFactor * 60 * this.timestepSize)
  }

  private get isDone() {
    return this.progress === Progress.Done
  }

  private get isFailed() {
    return this.progress === Progress.Failed
  }

  public mounted() {
    const canvas = this.$refs.canvas as HTMLElement
    this.webvis = new Webvis({
      canvasId: canvas.id,
      dataUrl: Config.frameAnimationServer,
      vizId: this.vizId,
    })
    this.webvis.onServerConfigChanged = () => this.onConfigChanged()
    this.webvis.onFetchingData = (value: boolean) => this.onFetchingDataChanged(value)
    this.webvis.onTimestepChanged = (value: number) => this.onTimestepChanged(value)
  }

  public beforeDestroy() {
    if (this.webvis) this.webvis.destroy()
  }

  private changeSpeedFactor(add: number) {
    if (this.webvis) {
      this.playbackSpeedFactor = this.playbackSpeedFactor + add
      this.webvis.setPlaybackSpeed(this.playbackSpeedFactor * this.playbackSpeedFactor * this.playbackSpeedFactor)
    }
  }

  private onRangeChanged(event: Event) {
    const target = event.target as HTMLInputElement
    const step = parseFloat(target.value)
    if (this.webvis) this.webvis.seekTimestep(step)
  }

  private onRangeMouseDown(event: Event) {
    this.isRangeMouseDown = true
  }

  private onRangeMouseUp(event: Event) {
    this.isRangeMouseDown = false
  }

  private onConfigChanged() {
    if (this.webvis) {
      this.connected = true
      this.firstTimestep = this.webvis.firstTimestep
      this.lastTimestep = this.webvis.lastTimestep
      this.currentTimestep = this.webvis.firstTimestep
      this.timestepSize = this.webvis.timestepSize
      this.playbackSpeedFactor = this.webvis.playbackSpeedFactor
      this.progress = this.webvis.progress
    }
  }

  private onTimestepChanged(timestep: number) {
    if (!this.isRangeMouseDown) this.currentTimestep = timestep
  }

  private onFetchingDataChanged(value: boolean) {
    this.isFetchingData = value
  }
}
</script>

<style scoped>
.header {
  margin: 1.5rem;
}

.frameAnimation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.canvasContainer {
  flex: 1;
  display: grid;
  grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr;
}

.canvas {
  height: 100%;
  width: 100%;
  grid-area: 1 / 1 / span 3 / span 3;
}

.loaderContainer {
  grid-area: 2 / 2 / span 1 / span 1;
  z-index: 10;
  justify-self: center;
  align-self: center;
  display: grid;
  justify-items: center;
}

.controls {
  display: grid;
  grid-template-rows: 1 1;
  margin: 1rem 1.5rem;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 14rem 7rem;
  grid-column-gap: 1rem;
}

.speedControls {
  display: flex;
  flex-direction: row;
}

.speedInput {
  margin: 0 0.5rem;
}

.bufferState {
  justify-self: right;
  align-self: end;
}
</style>
