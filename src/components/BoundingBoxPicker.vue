<template lang="pug">
#container
  #mymap
  #button-bar
    p Hold SHIFT and drag to set bounding box.
    button.button.is-small(@click="clickedCancel") Cancel
    button.button.is-small(@click="clickedSet"
      :disabled="!boxStart || !boxEnd"
      :class='{"is-link": boxStart && boxEnd}') Set
</template>

<script lang="ts">
'use strict'

import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Project } from '@/entities/Entities'
import mapboxgl from 'mapbox-gl'

@Component({ components: {} })
export default class BoundingBoxPicker extends Vue {
  private mymap!: mapboxgl.Map

  private boxStart: any = null
  private boxEnd: any = null

  public async mounted() {
    this.setupMap()
  }

  private setupMap() {
    this.mymap = new mapboxgl.Map({
      bearing: 0,
      center: [13.4, 45.5], // lnglat, not latlng
      container: 'mymap',
      dragRotate: false,
      logoPosition: 'bottom-left',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      zoom: 4,
    })

    this.mymap.on('style.load', this.mapIsReady)
    this.mymap.on('boxzoomstart', this.handleBoxZoomStart)
    this.mymap.on('boxzoomend', this.handleBoxZoomEnd)
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }

  private mapIsReady() {
    console.log('boop')
  }

  private handleBoxZoomStart(e: any) {
    console.log(e)
    const x = e.originalEvent.layerX
    const y = e.originalEvent.layerY

    this.boxStart = this.mymap.unproject([x, y])
    console.log(this.boxStart)
  }

  private clickedCancel() {
    this.$emit('cancel')
  }

  private clickedSet() {
    this.$emit('set', [this.boxStart, this.boxEnd])
  }

  private handleBoxZoomEnd(e: any) {
    const x = e.originalEvent.layerX
    const y = e.originalEvent.layerY

    this.boxEnd = this.mymap.unproject([x, y])
    console.log(this.boxEnd)

    this.updateZoomBox()
  }

  private updateZoomBox() {
    if (!this.boxStart || !this.boxEnd) return

    const json: any = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [this.boxStart.lng, this.boxStart.lat],
            [this.boxStart.lng, this.boxEnd.lat],
            [this.boxEnd.lng, this.boxEnd.lat],
            [this.boxEnd.lng, this.boxStart.lat],
            [this.boxStart.lng, this.boxStart.lat],
          ],
        ],
      },
    }

    try {
      this.mymap.removeLayer('bbox')
      this.mymap.removeSource('my-data')
    } catch (e) {}

    this.mymap.addSource('my-data', {
      data: json,
      type: 'geojson',
    })

    this.mymap.addLayer({
      id: 'bbox',
      type: 'fill',
      source: 'my-data',
      paint: {
        'fill-color': '#22a',
        'fill-opacity': 0.3,
      },
    })
  }
}
</script>

<style scoped>
#container {
  background-color: black;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  height: 100%;
  max-height: 100vh;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

#mymap {
  width: 100%;
  height: 100%;
  background-color: white;
  overflow: hidden;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  z-index: 1;
}

#button-bar {
  display: flex;
  flex-direction: row;
  vertical-align: center;
  background-color: white;
  margin: 0.5rem auto;
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  z-index: 2;
  padding: 0.5rem 0.5rem;
  border-radius: 4px;
}

p {
  margin: auto 0px;
  font-size: 12px;
}

.button {
  margin: 0 0 0 0.5rem;
}
</style>


