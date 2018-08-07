import Entity from './Entity'
import Project from './Project'

export default interface FileEntry extends Entity {
  contentType: string
  project: Project
  sizeInBytes: number
  userFileName: String
}
