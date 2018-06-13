<template lang="pug">
    .frameAnimation
        .header
            h1 Here will be an Animation
            span The id is: {{vizId}}
        .canvasContainer
            canvas.canvas(ref="canvas" id="canvas")
</template>

<script lang="ts">
import Vue from 'vue'
import Webvis from './Webvis'

interface FrameAnimationState {
  vizId: String
}

export default Vue.extend({
  data(): FrameAnimationState {
    return {
      vizId: this.$route.params.vizId,
    }
  },
  mounted: function() {
    console.log('Loading webvis...')
    let canvas = this.$refs.canvas as HTMLElement
    let webvis = new Webvis({ canvasId: canvas.id, dataUrl: 'https://localhost:3002/' })
  },
})
</script>

<style scoped>
.frameAnimation {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.canvasContainer {
  display: flex;
  flex: 1;
}

.canvas {
  height: 100%;
  width: 100%;
}
</style>

