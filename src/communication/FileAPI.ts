import { JsogService } from 'jsog-typescript'
import Project from '@/entities/Project'
import { ContentType, HeaderKeys, Method } from '@/communication/Constants'
import AuthenticatedRequest from '@/auth/AuthenticatedRequest'
import Config from '@/config/Config'
import { CreateVisualizationRequest, VisualizationType, Visualization } from '@/entities/Visualization'

export default class FileAPI {
  private static PROJECT: string = Config.fileServer + '/projects'
  private static FILE: string = Config.fileServer + '/file/'
  private static FILE_UPLOAD: string = Config.fileServer + '/file/upload/'
  private static VISUALIZATION: string = 'visualizations/'
  private static VISUALIZATION_TYPE: string = Config.fileServer + '/visualization-types/'

  private static jsogService = new JsogService()

  public static async fetchAllPersonalProjects(): Promise<Project[]> {
    return await this.request<Project[]>(this.PROJECT, this.corsRequestOptions())
  }

  public static async fetchProject(projectId: string): Promise<Project> {
    return await this.request<Project>(this.PROJECT + '/' + projectId, this.corsRequestOptions())
  }

  public static async fetchVisualizationTypes(): Promise<VisualizationType[]> {
    return await this.request<VisualizationType[]>(this.VISUALIZATION_TYPE, this.corsRequestOptions())
  }

  public static async fetchVisualization(projectId: string, visualizationId: string): Promise<Visualization> {
    return await this.request<Visualization>(
      this.PROJECT + '/' + projectId + '/' + this.VISUALIZATION + visualizationId,
      this.corsRequestOptions()
    )
  }

  public static async createProject(projectName: string): Promise<Project> {
    const options = this.postRequestOptions({ name: projectName })
    return await this.request<Project>(this.PROJECT, options)
  }

  public static async createVisualization(request: CreateVisualizationRequest): Promise<Visualization> {
    const options = this.postRequestOptions(request)
    return await this.request<Visualization>(`${this.PROJECT}/${request.projectId}/${this.VISUALIZATION}`, options)
  }

  public static async deleteVisualization(projectId: string, vizId: string) {
    const options: RequestInit = {
      mode: 'cors',
      method: Method.DELETE,
    }
    return await this.request(`${this.PROJECT}/${projectId}/${this.VISUALIZATION}/${vizId}`, options)
  }

  public static async uploadFiles(files: File[], project: Project): Promise<Project> {
    const formData = new FormData()
    for (const file of files) {
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

  public static async downloadFile(fileId: string, projectId: string): Promise<Blob> {
    const url = `${this.PROJECT}/${projectId}/files/${fileId}`
    const result = await AuthenticatedRequest.fetch(url, this.corsRequestOptions())

    if (result.ok) {
      const file = await result.blob()
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
    const headers = new Headers()
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
    const result = await AuthenticatedRequest.fetch(endpoint, options)
    if (result.ok) {
      const message = await result.json()
      return this.jsogService.deserialize(message) as any
    } else {
      throw await this.generateError(result)
    }
  }

  private static async generateError(response: Response): Promise<Error> {
    const error = await response.json()
    console.error(error)
    return new Error(error.error_description)
  }
}
