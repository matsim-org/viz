<template>
  <div id="mymap"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import * as mapbox from 'mapbox-gl'

@Component
export default class MyViz extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  private message = 'Hello Viz Class! Woohoo we did it!'

  public mounted() {
    this.setupMap()
  }

  private setupMap() {
    // this is a required workaround to get the mapbox token assigned in TypeScript
    // see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
    const writableMapBox: any = mapbox
    writableMapBox.accessToken =
      'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

    const map = new mapbox.Map({
      bearing: 0,
      center: [13.4, 52.5], // lnglat, not latlng
      container: 'mymap',
      logoPosition: 'bottom-left',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      zoom: 11,
    })

    map.on('style.load', this.mapIsReady)
    map.addControl(new mapbox.NavigationControl(), 'top-right')
  }

  private mapIsReady() {
    // TODO: do nothing for now, we'll add stuff later
  }
}
</script>