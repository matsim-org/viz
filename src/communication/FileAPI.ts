import Project from '../entities/Project'
import SharedStore from '../SharedStore'

export default class FileAPI {
  private static FILE_API = 'http://localhost:3001/'
  private static PROJECT: string = 'project/'
  private static FILE: string = 'file/'

  public static async fetchAllPersonalProjects(): Promise<Array<Project>> {
    return await this.request<Array<Project>>(
      this.PROJECT,
      this.authorizedPostRequestOptions({})
    )
  }

  public static async fetchProjects(
    projectIds: string[]
  ): Promise<Array<Project>> {
    const body = { projectIds: projectIds }
    return await this.request<Array<Project>>(
      this.PROJECT,
      this.authorizedPostRequestOptions(body)
    )
  }

  public static async createProject(projectName: string): Promise<Project> {
    let options = this.authorizedPostRequestOptions({ name: projectName })
    options.method = 'PUT'
    return await this.request<Project>(this.PROJECT, options)
  }

  public static async uploadFiles(
    files: Array<File>,
    project: Project
  ): Promise<Project> {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      formData.append(file.name, file)
    }
    formData.append('projectId', project.id)

    return await this.request<Project>(this.FILE, {
      method: 'POST',
      mode: 'cors',
      headers: {
        authorization: 'Bearer ' + SharedStore.accessToken,
      },
      body: formData,
    })
  }

  private static authorizedPostRequestOptions(body: any): RequestInit {
    return {
      method: 'POST',
      mode: 'cors',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + SharedStore.accessToken,
      },
      body: JSON.stringify(body),
    }
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    let result = await fetch(this.FILE_API + endpoint, options)

    if (result.ok) {
      return await result.json()
    } else if (result.status === 401) {
      //unauthorized
      //the token is not valid. A new one must be requested
      throw Error(
        'Token was not valid. Retreival of new token must be implemented'
      )
    } else {
      let error = await result.json()
      console.error(error)
      throw new Error(error.error_description)
    }
  }
}
