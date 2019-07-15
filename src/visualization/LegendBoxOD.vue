<template lang="pug">
#legend-container
  p.title Legend:
  .legend-item(v-for="item in rows")
    .legend-col(v-if ="typeof item === 'string' && item.includes('#')")(:style="{'background-color': item}")
    .legend-element1(v-if ="typeof item === 'string' && !item.includes('#') && item == ('↓')") {{item}}
    .legend-element2(v-if ="typeof item === 'string' && !item.includes('#') && item != ('↓')") {{item}}
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Method } from '../communication/Constants'

@Component
export default class LegendBox extends Vue {
  @Prop({ type: Array, required: true })
  private rows!: any

  public created() {
    console.log(this.rows)
  }
}
</script>

<style scoped>
#legend-container {
  display: flex;
  flex-direction: row;
  color: white;
  background-color: #222222cc;
  padding: 0.5rem 0.5rem;
  border: solid 1px #666;
  border-radius: 2px;
}

.legend-item {
  display: flex;
  flex-direction: row;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
}

.legend-col {
  width: 1rem;
  margin-top: 0.7rem;
  height: 2rem;
}

p.title {
  color: #ccc;
  font-size: 0.9rem;
  text-transform: uppercase;
  margin-bottom: 1rem;
  margin-top: 1.1rem;
  margin-right: 2rem;
  font-weight: normal;
}
.legend-element1 {
  color: #000000;
  font-size: 1.2rem;
  stroke: black;
  font-weight: bold;
  margin-right: 1rem;
  margin-left: -1.75rem;
  margin-top: 0.7rem;
}

.legend-element2 {
  color: #ffffff;
  font-size: 1.2rem;
  stroke: white;
  font-weight: bold;
  margin-right: 1rem;
  margin-left: -0.8rem;
  margin-top: 0.7rem;
}
</style>