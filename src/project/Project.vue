<template lang="pug">
  .project
    .header
      .headline
        h1 {{project.name}}
        span {{project.id}}
      span(v-if="isFetchingData") Fetching project data...

    list-header(v-on:btnClicked="handleAddFileClicked" title="Files" btnTitle="Add File")
    input.fileInput(type="file" 
          id="fileInput"
          ref="fileInput"
          multiple
          v-on:change="onFileInputChanged"
          )
    .files
      .emptyMessage(v-if="project.files.length === 0")
        span No files yet. Add some!
      .fileList
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
            
</template>

<style>
.project {
  margin: 1rem;
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
import SharedStore, { SharedState } from '../SharedStore'
import Project from '../entities/Project'
import FileAPI from '../communication/FileAPI'
import { File } from 'babel-types'

interface ProjectState {
  sharedState: SharedState
  project: Project
  isFetchingData: boolean
}

export default Vue.extend({
  components: {
    'list-header': ListHeader,
    'list-element': ListElement,
  },
  data(): ProjectState {
    return {
      sharedState: SharedStore.state,
      project: {
        id: this.$route.params.id,
        name: '',
        files: [],
      },
      isFetchingData: false,
    }
  },
  created: async function() {
    // check if project with id exists in personalProjects
    let project = this.sharedState.personalProjects.find(element => element.id === this.projectId)

    //if not, request the project
    if (project) {
      this.project = project
    }

    if (!project || project.files.length < 1) {
      this.isFetchingData = true
      let fetchedProjects = await FileAPI.fetchProjects([this.projectId])
      if (fetchedProjects.length > 0) {
        this.project = fetchedProjects[0]
      }
      this.isFetchingData = false
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
    handleFileClicked: async function(fileId: string) {
      try {
        let blob = await FileAPI.downloadFile(fileId, this.project)
        window.open(URL.createObjectURL(blob))
      } catch (e) {
        console.log(e)
      }
    },
    handleDeleteFileClicked: async function(fileId: string) {
      try {
        this.project = await FileAPI.deleteFile(fileId, this.project)
      } catch (e) {
        console.log(e)
      }
    },
    onFileInputChanged: async function() {
      const files = (this.$refs.fileInput as any).files
      const updatedProject = await FileAPI.uploadFiles(files, this.project)
      this.project = updatedProject
    },
  },
})
</script>


