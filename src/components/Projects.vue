<template lang="pug">
  .projects
    div.projectListHeader
      h1 Your projects
      router-link(to="/projects/new")
        button.ui.green.button Create Project

    div.emptyMessage(v-if="sharedState.personalProjects.length === 0")
      span No projects yet. Create one!
    div.ui.relaxed.divided.list(v-else  )  
      div.ui.item(v-for="project in sharedState.personalProjects")
        div.itemContainer
          button.projectBtn(v-on:click="onProjectClicked(project.id)")
            div.ui.header {{project.name}}
            div.ui.descriptions {{project.id}}

</template>


<script lang="ts">
import Vue from 'vue'
import Project from '../entities/Project'
import FileAPI from '../communication/FileAPI'
import SharedStore, { SharedState } from '../SharedStore'

export default Vue.extend({
  data() {
    return {
      sharedState: SharedStore.state,
    }
  },
  methods: {
    onProjectClicked(id: string) {
      this.$router.push({ path: `/project/${id}` })
    },
  },
  created: async function() {
    try {
      await SharedStore.fetchProjects()
    } catch (error) {
      console.error(error)
    }
  },
})
</script>

<style scoped>
.projects {
  margin: 1rem;
}
.projectListHeader {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.emptyMessage {
  padding-top: 3rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.itemContainer {
  display: flex;
  flex-direction: row;
  align-content: stretch;
}
.projectBtn {
  flex: 1;
  background-color: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
  margin: 0;
  text-align: inherit;
  font-size: inherit;
  cursor: pointer;
}

.projectBtn:hover {
  text-decoration: underline;
}
</style>
