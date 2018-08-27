import Entity from '@/entities/Entity'
import Project from '@/entities/Project'

export default interface FileEntry extends Entity {
  contentType: string
  project: Project
  sizeInBytes: number
  userFileName: string
}
