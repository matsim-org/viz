<template lang="pug">
.xpage-contents
  list-header(v-on:btnClicked="handleCreateClicked" title="" btnTitle="New Project")

  div.emptyMessage(v-if="projects.length === 0")
    span You don't have any projects yet. Create one!
  .projectList(v-else)
    list-element(v-for="project in projects"
                  v-bind:key="project.id"
                  v-on:itemClicked="onProjectSelected(project)")
      span(slot="title") {{project.name}}
      span(slot="content") {{project.id}}
      button.delete.is-medium(slot="accessory" @click="onDeleteProject(project)")

  create-project(v-if="showCreateProject" v-on:close="handleCreateProjectClosed" v-bind:project-store="projectStore")
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import CreateProject from '@/project/CreateProject.vue'
import FileAPI from '@/communication/FileAPI'
import SharedStore, { SharedState } from '@/SharedStore'
import EventBus from '@/EventBus.vue'
import ProjectStore, { ProjectState } from '@/project/ProjectStore'
import { Project } from '@/entities/Entities'
import { Event } from '_debugger'

const vueInstance = Vue.extend({
  props: {
    projectStore: ProjectStore,
  },
  components: {
    'list-header': ListHeader,
    'list-element': ListElement,
    'create-project': CreateProject,
  },
  data() {
    return {
      projectsState: this.projectStore.State,
    }
  },
})

@Component
export default class ProjectsViewModel extends vueInstance {
  private showCreateProject = false

  private get projects() {
    return this.projectsState.projects
  }

  public mounted() {
    EventBus.$emit('set-breadcrumbs', [{ title: 'My Projects', link: '/projects' }])
  }

  private handleCreateClicked() {
    this.showCreateProject = true
  }

  private handleCreateProjectClosed() {
    this.showCreateProject = false
  }

  private async created() {
    try {
      await this.projectStore.fetchProjects()
    } catch (error) {
      console.error(error)
    }
  }

  private onProjectSelected(project: Project) {
    this.$router.push({ path: `/project/${project.id}` })
  }

  private async onDeleteProject(project: Project) {
    try {
      await this.projectStore.deleteProject(project)
    } catch (error) {
      console.log('error')
    }
  }
}
</script>

<style scoped>
.xpage-contents {
  padding: 0rem 0rem 3rem 0rem;
}

.projectList {
  display: flex;
  flex-direction: column;
  align-content: stretch;
}

.emptyMessage {
  padding-top: 3rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  font-size: 1.3rem;
}

.itemContainer {
  display: flex;
  flex-direction: row;
  align-content: stretch;
}

.projectItem {
  flex: 1;
  background-color: transparent;
  border: none;
  font-family: inherit;
  padding: 0;
  margin: 0;
  text-align: inherit;
  font-size: inherit;
  cursor: pointer;
  transition-duration: 0.2s;
}

.projectItem:hover {
  background-color: #f0f0f0;
}
</style>
