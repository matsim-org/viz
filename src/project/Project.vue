<template lang="pug">
  .project
    .header
      .headline
        h1 {{project.name}}
        span {{project.id}}
      span(v-if="isFetchingData") Fetching project data...

    section
      list-header(v-on:btnClicked="handleAddVisualizationClicked" title="Visualizations" btnTitle="Add Viz")
      .visualizations
        .emptyMessage(v-if="project.visualizations && project.visualizations.length === 0")
          span No Visualizations yet. Add some!
        div(v-else v-for="viz in project.visualizations" v-on:click="handleVisualizationClicked(viz)")
          list-element(v-bind:key="viz.id")
            .itemTitle(slot="title")
              span {{ viz.type.key}}
            span(slot="content") {{viz.id}}

    section
      list-header(v-on:btnClicked="handleAddFileClicked" title="Files" btnTitle="Add File")
      input.fileInput(type="file"
          id="fileInput"
          ref="fileInput"
          multiple
          v-on:change="onFileInputChanged"
          )
      .files
        .emptyMessage(v-if="project.files && project.files.length === 0")
          span No files yet. Add some!
        .fileList(v-else)
          .fileItem(v-for="file in project.files")
            list-element( v-bind:key="file.id" v-on:itemClicked="handleFileClicked(file.id)")
              .itemTitle(slot="title")
                span {{file.userFileName}}
                span {{file.sizeInBytes}} Bytes
              span(slot="content") {{file.id}}
              button.ui.animated.negative.basic.button(slot="accessory" v-on:click="handleDeleteFileClicked(file.id)")
                .ui.visible.content Delete
                .ui.hidden.content
                  i.ui.trash.icon
    create-visualization(v-if="showCreateVisualization"
                         v-on:close="handleAddVisualizationClosed"
                         v-bind:project="project")
</template>

<style>
section {
  margin: 4rem 0 4rem 0;
}

.project {
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.headline {
  display: flex;
  flex-direction: column;
  margin-bottom: 2rem;
}

.fileInput {
  display: none;
}

.itemTitle {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.fileList {
  display: flex;
  flex-direction: column;
  align-content: stretch;
}

.fileItem {
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

.fileItem:hover {
  background-color: #f0f0f0;
}

.emptyMessage {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 3rem;
}
</style>

<script lang="ts">
import Vue from 'vue'
import ListHeader from '@/components/ListHeader.vue'
import ListElement from '@/components/ListElement.vue'
import Modal from '@/components/Modal.vue'
import CreateVisualization from '@/project/CreateVisualization.vue'
import SharedStore, { SharedState } from '../SharedStore'
import Project from '../entities/Project'
import { Visualization } from '../entities/Visualization'
import FileAPI from '../communication/FileAPI'
import { File } from 'babel-types'

interface ProjectState {
  sharedState: SharedState
  project: Project
  isFetchingData: boolean
  showCreateVisualization: boolean
}

export default Vue.extend({
  components: {
    'list-header': ListHeader,
    'list-element': ListElement,
    modal: Modal,
    'create-visualization': CreateVisualization,
  },
  data(): ProjectState {
    return {
      sharedState: SharedStore.state,
      project: {
        id: this.$route.params.projectId,
        name: '',
        files: [],
        creator: {},
        visualizations: [],
      },
      isFetchingData: false,
      showCreateVisualization: false,
    }
  },
  created: async function(): Promise<void> {
    const project = this.sharedState.personalProjects.find(element => element.id === this.project.id)
    if (project) {
      this.project = project
    }

    if (!project || !project.files) {
      this.isFetchingData = true
      this.project = await FileAPI.fetchProject(this.project.id)
      this.isFetchingData = false
    }

    if (this.sharedState.visualizationTypes.length < 1) {
      SharedStore.fetchVizTypes()
    }
  },
  computed: {
    projectId: function(): string {
      return this.$route.params.id
    },
  },
  methods: {
    handleAddFileClicked: function(): void {
      const input = this.$refs.fileInput as HTMLInputElement
      input.click()
    },
    handleFileClicked: async function(fileId: string): Promise<void> {
      try {
        const blob = await FileAPI.downloadFile(fileId, this.project)
        window.open(URL.createObjectURL(blob))
      } catch (e) {
        console.log(e)
      }
    },
    handleDeleteFileClicked: async function(fileId: string): Promise<void> {
      try {
        this.project = await FileAPI.deleteFile(fileId, this.project)
      } catch (e) {
        console.log(e)
      }
    },
    handleAddVisualizationClicked: function(): void {
      this.showCreateVisualization = true
    },
    handleAddVisualizationClosed: function(visualization: Visualization): void {
      this.showCreateVisualization = false
      if (visualization) this.project.visualizations.push(visualization)
    },
    handleVisualizationClicked: function(viz: Visualization): void {
      this.$router.push({ path: `/${viz.type.key}/${viz.id}` })
    },
    onFileInputChanged: async function(): Promise<void> {
      const files = (this.$refs.fileInput as any).files
      try {
        const updatedProject = await FileAPI.uploadFiles(files, this.project)
        this.project = updatedProject
      } catch (error) {
        console.error(error)
      }
    },
  },
})
</script>
