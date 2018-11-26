import FileAPI from '@/communication/FileAPI'

import UploadStore from './UploadStore'
import { Project, FileEntry, Visualization, PermissionType } from '@/entities/Entities'

export interface ProjectState {
  projects: Project[]
  selectedProject: Project
  isFetching: boolean
}

export enum ProjectVisibility {
  Public,
  Private,
}

export default class ProjectStore {
  private state: ProjectState

  get State() {
    return this.state
  }

  constructor(uploadStore: UploadStore) {
    this.state = this.getInitialState()
    uploadStore.FileUploadedEvent.addEventHandler(fileEntry => this.addFileEntry(fileEntry))
  }

  public async fetchProjects() {
    this.state.isFetching = true
    try {
      this.state.projects = await FileAPI.fetchAllPersonalProjects()
    } finally {
      this.state.isFetching = false
    }
  }

  public async createProject(name: string) {
    this.state.isFetching = true
    try {
      const project = await FileAPI.createProject(name)
      this.state.projects.push(project)
      return project
    } finally {
      this.state.isFetching = false
    }
  }

  public async changeNameOfSelectedProject(newName: string) {
    this.state.isFetching = true
    try {
      const currentProject = this.state.selectedProject
      await FileAPI.patchProject(currentProject.id, newName)
      currentProject.name = newName
    } finally {
      this.state.isFetching = false
    }
  }

  public async changeVisibilityOfSelectedProject(visibility: ProjectVisibility) {
    const currentProject = this.state.selectedProject
    const publicPermission = currentProject.permissions.find(permission => permission.agent.authId === 'allUsers')
    try {
      this.state.isFetching = true
      if (visibility === ProjectVisibility.Private && publicPermission) {
        await FileAPI.removePermission(currentProject.id, publicPermission.agent.authId)
        currentProject.permissions = currentProject.permissions.filter(p => p !== publicPermission)
      } else if (visibility === ProjectVisibility.Public && !publicPermission) {
        const permission = await FileAPI.addPermission(currentProject.id, 'allUsers', PermissionType.Read)
        currentProject.permissions.push(permission)
      }
    } finally {
      this.state.isFetching = false
    }
  }

  public async selectProject(id: string) {
    const foundProject = this.state.projects.find(project => project.id === id)
    if (foundProject) this.state.selectedProject = foundProject
    await this.fetchProject(id)
  }

  public addFileEntry(fileEntry: FileEntry) {
    const project = this.state.projects.find(p => p.id === fileEntry.project.id)
    if (project) {
      project.files.push(fileEntry)
    }
  }

  public async deleteFile(id: string) {
    const currentProject = this.state.selectedProject
    this.state.isFetching = true
    try {
      await FileAPI.deleteFile(id, currentProject)
      currentProject.files = currentProject.files.filter(file => file.id !== id)
    } finally {
      this.state.isFetching = false
    }
  }

  public async addTagToSelectedProject(name: string, type: string) {
    this.state.isFetching = true
    try {
      const currentProject = this.state.selectedProject
      const tag = await FileAPI.createTag(
        {
          name: name,
          type: type,
        },
        currentProject.id
      )
      currentProject.tags.push(tag)
    } finally {
      this.state.isFetching = false
    }
  }

  public async addVisualizationToSelectedProject(visualization: Visualization) {
    this.state.selectedProject.visualizations.push(visualization)
  }

  public async fetchProject(id: string) {
    this.state.isFetching = true
    try {
      const fetchedProject = await FileAPI.fetchProject(id)
      this.state.selectedProject = fetchedProject
      const index = this.state.projects.findIndex(project => project.id === fetchedProject.id)
      if (index >= 0) {
        this.state.projects[index] = fetchedProject
      } else {
        this.state.projects.push(fetchedProject)
      }
    } finally {
      this.state.isFetching = false
    }
  }

  public async fetchVisualizationsForProject(project: Project) {
    this.state.isFetching = true
    try {
      const fetchedVisualizations = await FileAPI.fetchVizualizationsForProject(project.id)
      const stateProject = this.state.projects.find(p => p.id === project.id)
      if (stateProject) {
        stateProject.visualizations = fetchedVisualizations
      } else {
        throw new Error('couldn"t find project')
      }
    } finally {
      this.state.isFetching = false
    }
  }

  private getInitialState(): ProjectState {
    return {
      projects: [],
      isFetching: false,
      selectedProject: {
        creator: undefined,
        files: [],
        id: '',
        name: '',
        visualizations: [],
        tags: [],
        createdAt: 0,
        permissions: [],
      },
    }
  }
}
