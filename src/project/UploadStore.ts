import Config from '@/config/Config'
import SimpleEvent, { SimpleEventEmmiter } from './Event'
import AuthenticationStore from '@/auth/AuthenticationStore'
import { JsogService } from 'jsog-typescript'
import { Project, Tag, FileEntry } from '@/entities/Entities'

export enum UploadStatus {
  NotStarted,
  Started,
  Uploaded,
  Failed,
}
export interface UploadState {
  // this must be a plain array to make vue's reactivity system play nicely with
  // updates to properties of single FileUploads
  uploads: FileUpload[]
}

export interface FileUpload {
  project: Project
  file: File
  tags: Tag[]
  status: UploadStatus
  progress: number
}

export default class UploadStore {
  private static jsogService = new JsogService()
  private state: UploadState
  private fileUploadedEvent: SimpleEventEmmiter<FileEntry> = new SimpleEventEmmiter()
  private authStore: AuthenticationStore

  public get State() {
    return this.state
  }

  public get FileUploadedEvent(): SimpleEvent<FileEntry> {
    return this.fileUploadedEvent
  }

  constructor(authStore: AuthenticationStore) {
    this.authStore = authStore
    this.state = this.getInitialState()
  }

  public uploadFiles(files: FileUpload[]) {
    // this forEach loop runs synchronosly. It starts all file uploads at once
    // this is intended behavior
    files.forEach(async file => {
      this.state.uploads.push(file)

      try {
        const result = await this.uploadFile(file)
        file.status = UploadStatus.Uploaded

        const index = this.state.uploads.indexOf(file)
        this.state.uploads.splice(index, 1)

        this.emmitFileUploaded(result)
      } catch (error) {
        console.error(error)
        file.status = UploadStatus.Failed
      }
    })
  }

  private async uploadFile(upload: FileUpload): Promise<FileEntry> {
    // We are using XMLHttpReqeust instead of 'fetch' to get progress
    const request = new XMLHttpRequest()
    const promise = new Promise<FileEntry>((resolve, reject) => {
      request.upload.onloadstart = () => (upload.status = UploadStatus.Started)
      request.upload.onprogress = (event: ProgressEvent) => this.handleUploadProgress(event, upload)
      request.onreadystatechange = () => {
        if (this.isSuccess(request)) {
          const message = JSON.parse(request.responseText)
          const result = UploadStore.jsogService.deserialize(message) as FileEntry
          resolve(result)
        } else if (this.isFailed(request)) {
          reject('error on upload')
        }
      }
    })

    const formData = new FormData()
    formData.append('file', upload.file)
    const tagIds = upload.tags.map(tag => tag.id)
    formData.append('data', JSON.stringify({ tagIds: tagIds }))
    request.open('POST', `${Config.fileServer}/projects/${upload.project.id}/files`)
    request.setRequestHeader('Authorization', 'Bearer ' + this.authStore.state.accessToken)
    request.send(formData)
    return promise
  }

  private async emmitFileUploaded(file: FileEntry) {
    this.fileUploadedEvent.emmit(file)
  }

  private isSuccess(request: XMLHttpRequest) {
    return request.readyState === 4 && request.status === 200
  }

  private isFailed(request: XMLHttpRequest) {
    return request.readyState === 4 && request.status !== 200
  }

  private handleUploadProgress(event: ProgressEvent, upload: FileUpload) {
    if (event.lengthComputable) {
      upload.progress = event.loaded / event.total
    }
  }

  private getInitialState(): UploadState {
    return {
      uploads: [],
    }
  }
}
