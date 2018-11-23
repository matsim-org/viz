<template lang="pug">
.editable
    .content(v-if="!isEditing" @mouseover="showEdit=true" @mouseleave="showEdit=false")
        slot(name="content")
        .editTrigger(v-if="showEdit")
            a.button.is-small(@click="isEditing = true") 
                span.icon.is-small
                    i.fas.fa-pen
    .editing(v-if="isEditing")
        input.input(type="text" v-model="edited" @keyup.esc="isEditing=false")
        button.button(@click="onEdit") Save
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class Editable extends Vue {
  private isEditing = false
  private showEdit = false
  private edited = ''

  private onEdit() {
    this.isEditing = false
    this.$emit('editing-ended', this.edited)
  }
}
</script>

<style scoped>
.content {
  display: flex;
  flex-direction: row;
}

.editing {
  display: flex;
  flex-direction: row;
}

.input {
  max-width: 15rem;
}
</style>