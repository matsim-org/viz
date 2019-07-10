<template lang="pug">
#legend-container
  p.title Legend:
  .legend-item(v-for="item in rows")
    .legend-col-1(:style="{'background-color': item[0]}")
    .legend-col-2(:style="{'background-color': item[1]}")
  .direction ⇵



</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

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

.legend-col-1 {
  width: 1rem;
}

.legend-col-2 {
  margin-left: 0rem;
}
p.title {
  color: #ccc;
  font-size: 0.9rem;
  text-transform: uppercase;
  margin-bottom: 1rem;
  margin-right: 1rem;
  font-weight: normal;
}
.direction {
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: normal;
}
</style>
