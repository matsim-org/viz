<template lang="pug">
  .eventsAnimation
    .mainContainer
      .loaderContainer(v-if="isFailed")
        span Generating Visualization failed! Check your input files.
      .loaderContainer(v-if="!isDone && !isFailed")
        spinner
        span Server is processing files...
      .loaderContainer(v-if="!connected")
        spinner
        span Connecting to server...
      .canvasContainer
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

        button.button.playPause(v-on:click="togglePlayPause()")
          template(v-if="isPlaying")
            span.icon.is-small
              i.fas.fa-pause
          template(v-else)
            span.icon.is-small
              i.fas.fa-play
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
import AuthenticationStore from '@/auth/AuthenticationStore'
import Spinner from '@/components/Spinner.vue'

@Component({
  components: { spinner: Spinner },
})
export default class EventsAnimation extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

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

  private get currentTime() {
    return new Date(this.currentTimestep * 1000).toISOString().substr(11, 8)
  }

  private get speedFactor() {
    return Math.round(this.playbackSpeedFactor * 60 * this.timestepSize)
  }

  private get isDone() {
    return this.progress === 'Done'
  }

  private get isFailed() {
    return this.progress === 'Failed'
  }

  private changeSpeedFactor(add: number) {
    console.log('Change speed Factor is not yet implemented')
  }

  private togglePlayPause() {
    console.log('toggle play pause is not yet implemented')
  }

  private onRangeChanged(event: Event) {
    const target = event.target as HTMLInputElement
    const step = parseFloat(target.value)

    console.log('Range not yet implemented')
  }

  private onRangeMouseDown(event: Event) {
    this.isRangeMouseDown = true
  }

  private onRangeMouseUp(event: Event) {
    this.isRangeMouseDown = false
  }
}
</script>

<style scoped>
.header {
  margin: 1.5rem;
}

.eventsAnimation {
  display: grid;
  grid-template-rows: 1fr auto;
}

.mainContainer {
  flex: 1;
  display: grid;
  grid-template: 1fr 1fr 1fr / 1fr 1fr 1fr;
}

/* Having a container which fills the grid and a canvas filling the container, in addition
    to the container being relative and canvas being absolutely positioned is important to
    support resizing in different browsers
*/
.canvasContainer {
  position: relative;
  grid-area: 1 / 1 / span 3 / span 3;
}

.canvas {
  height: 100%;
  width: 100%;
  position: absolute;
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
  grid-template-rows: auto auto;
  margin: 1rem 1.5rem;
}

/* seems firefox needs an extra motivation to stretch a range */
.range {
  width: 100%;
}

.actions {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  grid-column-gap: 1rem;
}

.playPause {
  height: 3.3rem;
  width: 3.5rem;
  align-self: end;
}

.playPauseIcon {
}

.speedControls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-column-gap: 0.5rem;
}

.bufferState {
  justify-self: right;
  align-self: end;
}
</style>

