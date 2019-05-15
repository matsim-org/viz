<template lang="pug">
.time-slider-main-content
  vue-slider.time-slider(v-bind="timeSlider" v-model="sliderValue")
  .clock-labels
    .hour 00
    .hour 03
    .hour 06
    .hour 09
    .hour 12
    .hour 15
    .hour 18
    .hour 21
    .hour 24
</template>

<script lang="ts">
import * as timeConvert from 'convert-seconds'
import vueSlider from 'vue-slider-component'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component({ components: { 'vue-slider': vueSlider }, props: { initialTime: Number } })
export default class TimeSlider extends Vue {
  private sliderValue: number = 0
  private timeSlider = {
    disabled: false,
    height: 8,
    min: 0,
    max: 86399,
    piecewise: false,
    show: true,
    contained: true,
    sliderStyle: [{ backgroundColor: '#f05b72' }, { backgroundColor: '#3498db' }],
    processStyle: {
      backgroundColor: '#00bb5588',
      borderColor: '#f05b72',
    },
    tooltip: 'always',
    'tooltip-placement': 'top',
    'tooltip-formatter': (index: number) => {
      return this.convertSecondsToClockTimeMinutes(index)
    },
  }

  private get clockTime() {
    return this.convertSecondsToClockTime(this.sliderValue)
  }

  // VUE LIFECYCLE HOOKS
  public created() {}
  public mounted() {}

  @Watch('initialTime')
  private initialTimeChanged(seconds: number) {
    this.sliderValue = seconds
  }

  @Watch('sliderValue')
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

  private convertSecondsToClockTime(index: number) {
    const hms = timeConvert(index)
    const minutes = ('00' + hms.minutes).slice(-2)
    const seconds = ('00' + hms.seconds).slice(-2)
    return `${hms.hours}:${minutes}:${seconds}`
  }
}
</script>

<style scoped>
@import '../../node_modules/vue-slider-component/theme/default.css';

.time-slider-main-content {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: auto;
  width: 100%;
  padding: 6px 4px 8px 4px;
}

.time-slider {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  margin: 0px 4px;
}

.clock-labels {
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  color: black;
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
