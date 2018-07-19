<template lang="pug">
    .frameAnimation
        .header
          h1 Frame Based Animation
          span Id: {{vizId}}
        .canvasContainer
          .loaderContainer(v-if="!isDone")
            .ui.active.indeterminate.small.inline.text.loader Server is processing files...
          .loaderContainer(v-if="!connected")
            .ui.active.small.inline.text.loader Connecting to server...
          canvas.canvas(ref="canvas" id="canvas")
        .controls
          .slider
            input.range(type="range" v-bind:min="firstTimestep" v-bind:max="lastTimestep" v-bind:step="timestepSize" v-bind:value="currentTimestep" v-on:input="handleRangeChanged($event)" v-on:mousedown="handleRangeMouseDown($event)" v-on:mouseup="handleRangeMouseUp($event)")
          .actions
            button.playPause.ui.icon.button(v-on:click="togglePlayPause()")
              i.pause.icon(v-if="isPlaying")
              i.play.icon(v-else)
            .bufferState
              .ui.active.small.inline.loader(v-if="isFetchingData")
            .inputWithLabel
              label.description.speedLbl(for="speedInput") Playpack speed
              .speedControls
                button.speedBtn.ui.compact.icon.button(v-on:click="changeSpeedFactor(0.5)")
                  i.ui.minus.icon
                .ui.mini.input
                  input(name="speedInput" readonly v-model="speedFactor")
                button.speedBtn.ui.compact.icon.button(v-on:click="changeSpeedFactor(2)")
                  i.ui.plus.icon
            .inputWithLabel
              label.description(for="timestepInput") Time
              .ui.mini.input
                input(type="text" readonly v-model="currentTime")
      
</template>

<script lang="ts">
import Vue from 'vue'
import Webvis from './Webvis'

interface FrameAnimationState {
  vizId: String
  isPlaying: boolean
  isFetchingData: boolean
  isRangeMouseDown: boolean
  firstTimestep: number
  lastTimestep: number
  currentTimestep: number
  timestepSize: number
  playbackSpeedFactor: number
  progress: String
  connected: boolean
  webvis?: Webvis
}

export default Vue.extend({
  data(): FrameAnimationState {
    return {
      vizId: this.$route.params.vizId,
      isPlaying: false,
      isFetchingData: false,
      isRangeMouseDown: false,
      firstTimestep: 0,
      lastTimestep: 1,
      currentTimestep: 0,
      timestepSize: 1,
      playbackSpeedFactor: 1,
      progress: 'Done',
      connected: false,
    }
  },
  computed: {
    currentTime: function() {
      return new Date(this.currentTimestep * 1000).toISOString().substr(11, 8)
    },
    speedFactor: function() {
      return this.playbackSpeedFactor * 60 * this.timestepSize
    },
    isDone: function() {
      return this.progress === 'Done'
    },
  },
  mounted: function() {
    let canvas = this.$refs.canvas as HTMLElement
    this.webvis = new Webvis({ canvasId: canvas.id, dataUrl: 'https://localhost:3020', vizId: this.vizId })
    this.webvis.onServerConfigChanged = () => this.handeConfigChanged()
    this.webvis.onFetchingData = (value: boolean) => this.handleFetchingDataChanged(value)
    this.webvis.onTimestepChanged = (value: number) => this.handleTimestepChanged(value)
  },
  beforeDestroy: function() {
    if (this.webvis) this.webvis.destroy()
  },
  methods: {
    togglePlayPause: function() {
      if (this.isPlaying) {
        this.webvis!.stopPlayback()
        this.isPlaying = false
      } else {
        this.webvis!.startPlayback()
        this.isPlaying = true
      }
    },
    changeSpeedFactor: function(multiplyBy: number) {
      if (this.webvis) {
        this.playbackSpeedFactor = this.playbackSpeedFactor * multiplyBy
        this.webvis.setPlaybackSpeed(this.playbackSpeedFactor)
      }
    },
    handleRangeChanged(event: Event) {
      let target = event.target as HTMLInputElement
      let step = parseFloat(target.value)
      if (this.webvis) this.webvis.seekTimestep(step)
    },
    handleRangeMouseDown(event: Event) {
      this.isRangeMouseDown = true
    },
    handleRangeMouseUp(event: Event) {
      this.isRangeMouseDown = false
    },
    handeConfigChanged: function() {
      if (this.webvis) {
        this.connected = true
        this.firstTimestep = this.webvis.firstTimestep
        this.lastTimestep = this.webvis.lastTimestep
        this.currentTimestep = this.webvis.firstTimestep
        this.timestepSize = this.webvis.timestepSize
        this.playbackSpeedFactor = this.webvis.playbackSpeedFactor
        this.progress = this.webvis.progress
      }
    },
    handleTimestepChanged: function(timestep: number) {
      if (!this.isRangeMouseDown) this.currentTimestep = timestep
    },
    handleFetchingDataChanged: function(value: boolean) {
      this.isFetchingData = value
    },
  },
})
</script>

<style scoped>
.frameAnimation {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  flex-direction: column;
}

.canvasContainer {
  display: flex;
  flex: 1;
}

.loaderContainer {
  position: absolute;
  z-index: 9000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.canvas {
  height: 100%;
  width: 100%;
}

.controls {
  display: flex;
  flex-direction: column;
  align-content: stretch;
}

.slider {
  display: flex;
  flex-direction: row;
}

.range {
  flex: 1;
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  flex-direction: row;
}

.actions > *:not(:first-child) {
  margin-left: 2rem;
}

.playPause {
  min-width: 4rem;
  min-height: 4rem;
}

.speedBtn {
  margin: 0 0.5rem 0 0.5rem;
}

.description {
  font-size: 0.8rem;
  color: rgb(138, 138, 138);
}

.speedLbl {
  margin-left: 0.5rem;
}

.inputWithLabel {
  display: flex;
  flex-direction: column;
}

.bufferState {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
</style>

