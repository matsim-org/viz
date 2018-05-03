<template lang="pug">
  transition(name="modal")
    .modal-mask(v-on:click="$emit('close-requested')")
        .modal-wrapper(v-on:click.stop="")
            .ui.active.modal
                .ui.header
                    slot(name="header")
                .ui.content
                    slot(name="content")
                .ui.actions
                    slot(name="actions")
</template>

<style>
.modal-mask {
  position: absolute;
  z-index: 9000;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: opacity 0.2s ease;
}

.modal-wrapper {
  transition: all 0.2s ease;
}

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-wrapper,
.modal-leave-active .modal-wrapper {
  -webkit-transform: scale(0.5);
  transform: scale(0.5);
}
</style>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({})
</script>


