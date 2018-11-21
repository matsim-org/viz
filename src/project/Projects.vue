<template lang="pug">
.projects
  .hero.is-success
    .hero-body
      p.title MATSim Viz: My Projects
      p.subtitle &nbsp;

  .page-contents
    list-header(v-on:btnClicked="handleCreateClicked" title="My Projects" btnTitle="New Project")

    div.emptyMessage(v-if="projects === 0")
      span No projects yet. Create one!

    .projectList(v-else)
        button.projectItem(
          v-for="project in projects"
          @click="handleProjectClicked(project.id)"
        )
          list-element(v-bind:key="project.id")
            span(slot="title") {{project.name}}
            span(slot="content") {{project.id}}

    create-project(v-if="showCreateProject" v-on:close="handleCreateProjectClosed" v-bind:project-store="projectStore")
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import CreateProject from '@/project/CreateProject.vue'
import Project from '@/entities/Project'
import FileAPI from '@/communication/FileAPI'
import SharedStore, { SharedState, EventBus } from '@/SharedStore'
import ProjectStore, { ProjectState } from '@/project/ProjectStore'

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

  private handleProjectClicked(id: string) {
    this.$router.push({ path: `/project/${id}` })
  }
}
</script>

<style scoped>
.page-contents {
  padding: 1.5rem 1.5rem;
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
