import SharedStore from '../SharedStore'
import AuthenticationStore from '../auth/Authentication'
import Project from '../entities/Project'
import { ContentType, HeaderKeys } from './Constants'

export default class FileAPI {
  private static FILE_API = 'https://localhost:3001/' //'http://cnode00.vsp.tu-berlin.de:3001/'
  private static PROJECT: string = 'project/'
  private static FILE: string = 'file/'
  private static FILE_UPLOAD: string = FileAPI.FILE + 'upload/'

  public static async fetchAllPersonalProjects(): Promise<Array<Project>> {
    return await this.request<Array<Project>>(this.PROJECT, this.authorizedPostRequestOptions({}))
  }

  public static async fetchProjects(projectIds: string[]): Promise<Array<Project>> {
    const body = { projectIds: projectIds }
    return await this.request<Array<Project>>(this.PROJECT, this.authorizedPostRequestOptions(body))
  }

  public static async createProject(projectName: string): Promise<Project> {
    let options = this.authorizedPostRequestOptions({ name: projectName })
    options.method = 'PUT'
    return await this.request<Project>(this.PROJECT, options)
  }

  public static async uploadFiles(files: Array<File>, project: Project): Promise<Project> {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      formData.append(file.name, file)
    }
    formData.append('projectId', project.id)

    let headers = new Headers()
    headers.append(HeaderKeys.AUTHORIZATION, 'Bearer ' + AuthenticationStore.state.accessToken)
    const options: RequestInit = {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: formData,
    }

    return await this.request<Project>(this.FILE_UPLOAD, options)
  }

  public static async downloadFile(fileId: string, project: Project): Promise<Blob> {
    const body = { fileId: fileId, projectId: project.id }
    const options = this.authorizedPostRequestOptions(body)

    let result = await fetch(this.FILE_API + this.FILE, options)

    if (result.ok) {
      let file = await result.blob()
      console.log('downloaded blop with size: ' + file.size)
      return file
    } else {
      throw await this.generateError(result)
    }
  }

  private static authorizedPostRequestOptions(body: any): RequestInit {
    let headers = new Headers()
    headers.append(HeaderKeys.AUTHORIZATION, 'Bearer ' + AuthenticationStore.state.accessToken)
    headers.append(HeaderKeys.CONTENT_TYPE, ContentType.APPLICATION_JSON)
    return {
      method: 'POST',
      mode: 'cors',
      headers: headers,
      body: JSON.stringify(body),
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    let result = await fetch(this.FILE_API + endpoint, options)
    if (result.ok) {
      const contentType = result.headers.get('content-type')
      return await result.json()
    } else {
      throw await this.generateError(result)
    }
  }

  private static async generateError(response: Response): Promise<Error> {
    if (response.status === 401) {
      //unauthorized
      //the token is not valid. A new one must be requested
      return Error('Token was not valid. Retreival of new token must be implemented')
    } else {
      let error = await response.json()
      console.error(error)
      return new Error(error.error_description)
    }
  }
}
