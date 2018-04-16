import Project from '../entities/Project'
import SharedStore from '../SharedStore'

const fileAPI = 'http://localhost:3001/'

export default {
  fetchProjects: async function(): Promise<Array<Project>> {
    const endpoint = 'project/'

    let headers = new Headers()
    headers.append('Authorization', 'Bearer ' + SharedStore.accessToken)

    let result = await fetch(fileAPI + endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + SharedStore.accessToken,
      },
      body: JSON.stringify({}),
    })

    if (result.ok) {
      let projects = (await result.json()) as Array<Project>
      return projects
    } else {
      throw new Error('could not fetch projects')
    }
  },

  createProject: async function(projectName: string): Promise<Project> {
    const endpoint = 'project/'

    let result = await fetch(fileAPI + endpoint, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + SharedStore.accessToken,
      },
      body: JSON.stringify({ name: projectName }),
    })
    if (result.ok) {
      let project = (await result.json()) as Project
      return project
    } else {
      let error = await result.json()
      throw new Error(error.error_description)
    }
  },
}
