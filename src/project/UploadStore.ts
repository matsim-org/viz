import { ProjectsState } from './ProjectsStore'
import Project from '@/entities/Project'
import FileEntry from '@/entities/File'

enum UploadStatus {
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
}

export default class UploadStore {
  private state: UploadState
  private uploads: Map<Project, FileUpload[]> = new Map()

  public get State() {
    return this.state
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
      const result = await this.uploadFile(file)
      // when finished, emit file uploaded event with uploaded file
      this.emmitFileUploaded(result)

      // unqueue the uploaded file
      const index = queuedUploads.indexOf(file)
      queuedUploads.splice(index, 1)
    })
  }

  private async uploadFile(file: FileUpload): Promise<FileEntry> {
    throw new Error('not implemented')
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
