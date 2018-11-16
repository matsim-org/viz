import Project from '@/entities/Project'
import FileAPI from '@/communication/FileAPI'

export interface ProjectsState {
  projects: Project[]
  selectedProject: Project
  isFetching: boolean
}

export default class ProjectsStore {
  private state: ProjectsState

  get State() {
    return this.state
  }

  constructor() {
    this.state = this.getInitialState()
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

  public async selectProject(id: string) {
    const foundProject = this.state.projects.find(project => project.id === id)
    if (foundProject) this.state.selectedProject = foundProject
    await this.fetchProject(id)
  }

  public async addFilesToSelectedProject(files: File[]) {
    this.state.isFetching = true
    try {
      const updatedProject = await FileAPI.uploadFiles(files, this.state.selectedProject)
      this.state.selectedProject = updatedProject
    } finally {
      this.state.isFetching = false
    }
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

  private getInitialState(): ProjectsState {
    return {
      projects: [],
      isFetching: false,
      selectedProject: {
        creator: undefined,
        files: [],
        id: '',
        name: '',
        visualizations: [],
      },
    }
  }
}
