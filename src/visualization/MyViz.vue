<template>
  <div id="mymap"></div>
</template>

<script lang="ts">
import * as BlobUtils from 'blob-util'
import mapboxgl from 'mapbox-gl'
import { Vue, Component, Prop } from 'vue-property-decorator'
import sharedStore from '../SharedStore'
import FileAPI from '@/communication/FileAPI'
import { Visualization } from '@/entities/Entities'

// register component with the shared store
sharedStore.addVisualizationType({
  typeName: 'my-viz',
  prettyName: 'My GeoJSON Plot',
  description: 'Shows pre-generated geojson data on a map',
  requiredFileKeys: ['geoJson'],
  requiredParamKeys: [],
})

@Component
export default class MyViz extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  private mymap!: mapboxgl.Map
  private visualization!: Visualization
  private myPopup!: mapboxgl.Popup

  public async mounted() {
    this.visualization = await this.fileApi.fetchVisualization(this.projectId, this.vizId)
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

  private async mapIsReady() {
    // Load geojson file using FileAPI
    const json = await this.fetchJson()
    console.log(json)

    this.calculateLinkProperties(json)
    this.addJsonToMap(json)
    this.setupMapPopup()
  }

  private calculateLinkProperties(json: any) {
    for (const link of json.features) {
      link.properties.vc = (1.0 * link.properties.base_demand) / link.properties.capacity
      link.properties.width = 0.005 * link.properties.base_demand
    }
  }

  private addJsonToMap(json: any) {
    this.mymap.addSource('my-data', {
      data: json,
      type: 'geojson',
    })

    this.mymap.addLayer(
      {
        id: 'my-layer',
        source: 'my-data',
        type: 'line',
        paint: {
          'line-opacity': 0.8,
          'line-width': ['get', 'width'],
          'line-color': {
            property: 'vc',
            stops: [[0.4, '#04c'], [0.8, '#084'], [1.0, '#0a0'], [1.3, '#cc0'], [1.7, '#fc0'], [2.0, '#800']],
          },
        },
      },
      'road-primary'
    ) // layer gets added just *above* this MapBox-defined layer.
  }

  private setupMapPopup() {
    const parent = this
    this.mymap.on('click', 'my-layer', function(e: any) {
      parent.clickedOnLink(e)
    })
  }

  private clickedOnLink(e: any) {
    // the browser delivers some details that we need, in the fn argument 'e'
    const props = e.features[0].properties

    // build HTML of popup window
    const html =
      '<h4>Link Values:</h4>' +
      'Freespeed: ' +
      props.Freespeed.toFixed(2) +
      '<br>capacity: ' +
      props.capacity.toFixed(2) +
      '<br>demand: ' +
      props.base_demand

    this.myPopup = new mapboxgl.Popup({ closeOnClick: true }).setLngLat(e.lngLat).setHTML(html)
    this.myPopup.addTo(this.mymap)
  }

  private async fetchJson() {
    try {
      console.log(this.visualization)
      const jsonFile = this.visualization.inputFiles.geoJson.fileEntry.id
      const dataBlob = await this.fileApi.downloadFile(jsonFile, this.projectId)

      const rawJson = await BlobUtils.blobToBinaryString(dataBlob)
      const parsedJson = JSON.parse(rawJson)

      return parsedJson
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
</script>