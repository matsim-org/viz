<template lang="pug">
.time-slider-main-content
  vue-slider.time-slider(v-bind="timeSlider" v-model="currentTime")
  .clock-labels
    .hour &nbsp;0:00
    .hour 3:00
    .hour 6:00
    .hour 9:00
    .hour 12:00
    .hour 15:00
    .hour 18:00
    .hour 21:00
</template>

<script lang="ts">
import * as timeConvert from 'convert-seconds'
import vueSlider from 'vue-slider-component'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { EventBus } from '../SharedStore'

@Component({ components: { 'vue-slider': vueSlider } })
export default class TimeSlider extends Vue {
  private get clockTime() {
    return this.convertSecondsToClockTime(this.currentTime)
  }

  private currentTime: number = 0

  // INTERNAL STRUCTURES
  private timeSlider = {
    disabled: false,
    dotSize: 24,
    height: 8,
    min: 0,
    max: 86399,
    piecewise: false,
    show: true,
    tooltip: 'always',
    tooltipDir: 'center',
    width: '100%',
    sliderStyle: [{ backgroundColor: '#f05b72' }, { backgroundColor: '#3498db' }],
    tooltipStyle: [
      { backgroundColor: '#f05b72', borderColor: '#f05b72' },
      { backgroundColor: '#3498db', borderColor: '#3498db' },
    ],
    bgStyle: {
      backgroundImage: '-webkit-linear-gradient(left, #eee, #eee)',
      boxShadow: '1px 1px 2px 1px rgba(0,0,0,.36)',
    },
    processStyle: {
      backgroundColor: '#00bb5588',
      borderColor: '#f05b72',
    },
    formatter: (index: number) => {
      return this.convertSecondsToClockTimeMinutes(index)
    },
  }

  // VUE LIFECYCLE HOOKS
  public created() {}

  public mounted() {
    EventBus.$on('set-time', (seconds: number) => {
      this.resetTime(seconds)
    })
  }

  @Watch('currentTime')
  private sliderChangedEvent(seconds: number) {
    this.$emit('change', seconds)
  }

  private convertSecondsToClockTimeMinutes(index: number) {
    try {
      const hms = timeConvert(index)
      const minutes = ('00' + hms.minutes).slice(-2)
      return `${hms.hours}:${minutes}`
    } catch (e) {
      return '0:00'
    }
  }

  private resetTime(seconds: number) {
    this.currentTime = seconds
  }

  private convertSecondsToClockTime(index: number) {
    const hms = timeConvert(index)
    const minutes = ('00' + hms.minutes).slice(-2)
    const seconds = ('00' + hms.seconds).slice(-2)
    return `${hms.hours}:${minutes}:${seconds}`
  }
}
</script>

<style scoped>
.time-slider-main-content {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto;
  width: 100%;
  padding: 0px 28px 2px 4px;
}

.time-slider {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

.clock-labels {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  color: white;
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(auto-fit, 1fr);
  width: 100%;
  font-size: 10px;
  margin-top: 0px;
  pointer-events: none;
}

.hour {
  grid-row: 1/2;
}
</style>
