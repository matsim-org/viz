<template lang="pug">
#scale-container
  p.title Scale:
    .scale-element() {{"|↔︎|"}} 
    .scale-scale() {{"~ " + 25/this.rows + " trips"}}

</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Method } from '../communication/Constants'

@Component
export default class ScaleBox extends Vue {
  @Prop({ type: Array, required: true })
  private rows!: any

  public created() {
    console.log(this.rows)
  }
}
</script>

<style scoped>
#scale-container {
  display: flex;
  flex-direction: row;
  color: white;
  background-color: #222222cc;
  padding: 0.5rem 0.5rem;
  border: solid 1px #666;
  border-radius: 2px;
}

.scale-item {
  display: flex;
  flex-direction: row;
  margin-bottom: 0.25rem;
}

p.title {
  color: #ccc;
  font-size: 0.9rem;
  text-transform: uppercase;
  margin-bottom: 1rem;
  margin-top: 1.1rem;
  margin-right: 1rem;
  font-weight: normal;
}
.scale-element {
  color: #ffffffe1;
  position: relative;
  font-weight: normal;
  margin-right: 1rem;
  margin-top: 0.7rem;
}
.scale-scale {
  color: #ffffffe1;
  position: relative;
  font-variant: small-caps;
  font-weight: normal;
  margin-right: 0.2rem;
  margin-top: 0.7rem;
}
</style>