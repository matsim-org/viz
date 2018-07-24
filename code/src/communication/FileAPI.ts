import Project from '../entities/Project'
import { ContentType, HeaderKeys, Method } from './Constants'
import AuthenticatedRequest from '../auth/AuthenticatedRequest'
import Config from '../config/Config'
import { CreateVisualizationRequest, VisualizationType, Visualization } from '../entities/Visualization'

export default class FileAPI {
  private static PROJECT: string = Config.fileServer + '/projects'
  private static FILE: string = Config.fileServer + '/file/'
  private static FILE_UPLOAD: string = Config.fileServer + '/file/upload/'
  private static VISUALIZATION: string = 'visualizations/'
  private static VISUALIZATION_TYPE: string = Config.fileServer + '/visualization-types/'

  public static async fetchAllPersonalProjects(): Promise<Array<Project>> {
    return await this.request<Array<Project>>(this.PROJECT, this.corsRequestOptions())
  }

  public static async fetchProject(projectId: string): Promise<Project> {
    return await this.request<Project>(this.PROJECT + '/' + projectId, this.corsRequestOptions())
  }

  public static async fetchVisualizationTypes(): Promise<Array<VisualizationType>> {
    return await this.request<Array<VisualizationType>>(this.VISUALIZATION_TYPE, this.corsRequestOptions())
  }

  public static async createProject(projectName: string): Promise<Project> {
    let options = this.postRequestOptions({ name: projectName })
    return await this.request<Project>(this.PROJECT, options)
  }

  public static async createVisualization(request: CreateVisualizationRequest): Promise<Visualization> {
    let options = this.postRequestOptions(request)
    return await this.request<Visualization>(`${this.PROJECT}/${request.projectId}/${this.VISUALIZATION}`, options)
  }

  public static async uploadFiles(files: Array<File>, project: Project): Promise<Project> {
    let formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      let file = files[i]
      formData.append(file.name, file)
    }

    const options: RequestInit = {
      method: Method.POST,
      mode: 'cors',
      body: formData,
    }

    const url = `${this.PROJECT}/${project.id}/files`
    return await this.request<Project>(url, options)
  }

  public static async downloadFile(fileId: string, project: Project): Promise<Blob> {
    const url = `${this.PROJECT}/${project.id}/files/${fileId}`
    let result = await AuthenticatedRequest.fetch(url, this.corsRequestOptions())

    if (result.ok) {
      let file = await result.blob()
      console.log('downloaded blop with size: ' + file.size)
      return file
    } else {
      throw await this.generateError(result)
    }
  }

  public static async deleteFile(fileId: string, project: Project): Promise<Project> {
    const options = this.corsRequestOptions()
    options.method = Method.DELETE

    return await this.request<Project>(`${this.PROJECT}/${project.id}/files/${fileId}`, options)
  }

  private static postRequestOptions(body: any): RequestInit {
    let headers = new Headers()
    headers.append(HeaderKeys.CONTENT_TYPE, ContentType.APPLICATION_JSON)
    return {
      method: Method.POST,
      mode: 'cors',
      headers: headers,
      body: JSON.stringify(body),
    }
  }

  private static corsRequestOptions(): RequestInit {
    return {
      mode: 'cors',
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    let result = await AuthenticatedRequest.fetch(endpoint, options)
    if (result.ok) {
      const contentType = result.headers.get('content-type')
      return await result.json()
    } else {
      throw await this.generateError(result)
    }
  }

  private static async generateError(response: Response): Promise<Error> {
    let error = await response.json()
    console.error(error)
    return new Error(error.error_description)
  }
}
