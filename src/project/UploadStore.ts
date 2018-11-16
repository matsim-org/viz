import { ProjectsState } from './ProjectsStore'
import Project from '@/entities/Project'
import FileEntry from '@/entities/File'
import Config from '@/config/Config'
import SimpleEvent, { SimpleEventEmmiter } from './Event'
import AuthenticationStore from '@/auth/AuthenticationStore'
import { JsogService } from 'jsog-typescript'

export enum UploadStatus {
  NotStarted,
  Started,
  Uploaded,
  Failed,
}
export interface UploadState {
  testVar: string
}

// TODO this interface belongs somewhere else
export interface Tag {
  id: string
  name: string
  type: string
}

export interface FileUpload {
  file: File
  tags: Tag[]
  status: UploadStatus
  progress: number
}

export default class UploadStore {
  private static jsogService = new JsogService()
  private state: UploadState
  private uploads: Map<Project, FileUpload[]> = new Map()
  private fileUploadedEvent: SimpleEvent<FileEntry> = new SimpleEventEmmiter()

  public get State() {
    return this.state
  }

  public get FileUploadedEvent(): SimpleEvent<FileEntry> {
    return this.fileUploadedEvent
  }

  constructor() {
    this.state = this.getInitialState()
  }

  public async uploadFiles(forProject: Project, files: FileUpload[]) {
    files.forEach(async file => {
      // put files into upload queue
      let queuedUploads = this.uploads.get(forProject)
      if (!queuedUploads) {
        queuedUploads = []
        this.uploads.set(forProject, queuedUploads)
      }
      queuedUploads.push(file)

      // start a file upload for each
      const result = await this.uploadFile(forProject, file)

      // unqueue the uploaded file
      const index = queuedUploads.indexOf(file)
      queuedUploads.splice(index, 1)

      // when finished, emit file uploaded event with uploaded file
      this.emmitFileUploaded(result)
    })
  }

  private async uploadFile(forProject: Project, upload: FileUpload): Promise<FileEntry> {
    const request = new XMLHttpRequest()
    const promise = new Promise<FileEntry>((resolve, reject) => {
      request.onloadstart = () => (upload.status = UploadStatus.Started)
      request.onprogress = (event: ProgressEvent) => {
        if (event.lengthComputable) upload.progress = event.loaded / event.total
      }
      request.onloadend = (event: ProgressEvent) => {
        if (event.lengthComputable && event.loaded / event.total === 1) {
          upload.status = UploadStatus.Uploaded
        } else {
          upload.status = UploadStatus.Failed
        }
      }
      request.onreadystatechange = () => {
        if (request.readyState === 4 && request.status === 200) {
          const message = JSON.parse(request.responseText)
          const result = UploadStore.jsogService.deserialize(message) as FileEntry
          resolve(result)
        } else if (request.readyState === 4) {
          reject('error on upload')
        }
      }
    })
    // TODO: add auth header
    const formData = new FormData()
    formData.append('file', upload.file)
    formData.append('data', JSON.stringify({ tagIds: upload.tags }))

    request.open('POST', `${Config.fileServer}/projects/${forProject.id}/files`)
    request.setRequestHeader('Authorization', 'Bearer ' + AuthenticationStore.state.accessToken)
    request.send(formData)
    return promise
  }

  private async emmitFileUploaded(file: FileEntry) {
    throw new Error('not implemented')
  }

  private getInitialState(): UploadState {
    return {
      testVar: 'bla',
    }
  }
}
