import ProjectStore from '@/project/ProjectStore'

describe('ProjectStore', () => {
  it('removes projects after the server deleted them', async () => {
    const projectStore = await setUpProjectStore()

    await projectStore.deleteProject(projectStore.State.projects[0])
    expect(projectStore.State.projects.length).toEqual(1)
    expect(projectStore.State.projects[0].id).toBe('second-id')
  })
  it('remove visualizations after the server has removed them', async () => {
    const projectStore = await setUpProjectStore()
    const project = projectStore.State.projects[0]
    const viz = {
      id: 'viz-id',
      project: project,
    }
    project.visualizations.push(viz)

    await projectStore.deleteVisualization(viz)
    expect(projectStore.State.projects.find(p => p.id === project.id).visualizations.length).toBe(0)
  })
})

async function setUpProjectStore() {
  const fileApi = {
    deleteProject: projectId => {}, // does nothing
    deleteVisualization: (projectId, vizId) => {},
    fetchAllPersonalProjects: async () => {
      return Promise.resolve([
        {
          id: 'first-id',
          name: 'first',
          files: [],
          visualizations: [],
          tags: [],
          permissions: [],
        },
        {
          id: 'second-id',
          name: 'second',
          files: [],
          visualizations: [],
          tags: [],
          permissions: [],
        },
      ])
    },
  }

  const uploadStore = {
    FileUploadedEvent: {
      addEventHandler: fileEntry => {},
    },
  }

  const projectStore = new ProjectStore(fileApi, uploadStore)
  // fill the store with some projects
  await projectStore.fetchProjects()
  expect(projectStore.State.projects.length).toEqual(2)
  return projectStore
}
