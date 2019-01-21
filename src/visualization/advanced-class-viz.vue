<template>
  <div class="advanced-class-viz">
    <span>{{message}}</span> Your Id is:
    <span>{{vizId}}</span>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class AdvancedClass extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  private message = 'Hello Advanced Class!'
}
</script>

