<template lang="pug">
#datapanel
  .content-area(:class="{'is-hidden': isHidden, 'bye': isLeaving}")
    .info-header(v-if="title")
      h3(style="padding: 0.5rem 3rem; font-weight: normal;color: white;") {{ title }}
    .top-area

      slot

    .bottom-nav-bar
      button.button.is-small.is-outlined(@click="toggleHidePanel")
        i.fa.fa-arrow-left

  .restore-button(v-if="isHidden")
    button.button.is-small.is-link(@click="toggleHidePanel")
        i.fa.fa-arrow-right

</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component
export default class LeftDataPanel extends Vue {
  private isHidden = false
  private isLeaving = false

  @Prop({ type: String })
  private title!: string

  private toggleHidePanel() {
    if (this.isHidden) this.isHidden = !this.isHidden
    else {
      this.isLeaving = true
      setTimeout(() => {
        this.isHidden = true
        this.isLeaving = false
      }, 300)
    }
  }
}
</script>

<style scoped>
#datapanel {
  display: flex;
  flex-direction: column;
  z-index: 7;
  margin: 0.5rem 0rem 0.5rem 0.5rem;
  pointer-events: none;
}

.content-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.1);
  animation: 0.3s ease 0s 1 slideInFromLeft;
  pointer-events: auto;
}

.is-hidden {
  display: none;
}

.bye {
  animation: 0.3s ease 0s 1 slideOutToLeft;
}

.top-area {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: #eeeefff4;
}

.lower-area {
  padding: 0.5rem 0.5rem;
}

.bottom-nav-bar {
  padding: 0.2rem 0rem;
  background-color: white;
  text-align: center;
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

.restore-button {
  margin: auto 0rem 0rem 0rem;
  pointer-events: auto;
}

.info-header {
  text-align: center;
  background-color: #097c43;
  padding: 0.5rem 0rem;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  border-top: solid 1px #888;
  border-bottom: solid 1px #888;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideOutToLeft {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@media only screen and (max-width: 640px) {
  #datapanel {
    margin: 0rem 0rem 0rem 0rem;
  }

  .content-area {
    margin-bottom: 0rem;
  }

  .info-header {
    border-top-left-radius: 0rem;
    border-top-right-radius: 0rem;
    border-top: none;
  }

  .bottom-nav-bar {
    border-bottom-left-radius: 0rem;
    border-bottom-right-radius: 0rem;
  }

  .restore-button {
    margin-left: 0.5rem;
    margin-bottom: 0.5rem;
  }
}
</style>



