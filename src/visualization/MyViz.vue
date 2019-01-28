<template>
  <div id="mymap"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import mapboxgl from 'mapbox-gl'

@Component
export default class MyViz extends Vue {
  @Prop({ type: String, required: true })
  private mymap!: mapboxgl.Map

  public mounted() {
    this.setupMap()
  }

  private setupMap() {
    this.mymap = new mapboxgl.Map({
      bearing: 0,
      center: [13.4, 52.5], // lnglat, not latlng
      container: 'mymap',
      logoPosition: 'bottom-left',
      style: 'mapbox://styles/mapbox/dark-v9',
      pitch: 0,
      zoom: 11,
    })

    this.mymap.on('style.load', this.mapIsReady)
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }

  private mapIsReady() {
    // TODO: do nothing for now, we'll add stuff later
  }
}
</script>