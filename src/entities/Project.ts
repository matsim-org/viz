import Entity from '@/entities/Entity'
import User from '@/entities/User'
import { Visualization } from '@/entities/Visualization'
import FileEntry from '@/entities/File'

export interface Tag extends Entity {
  name: string
  type: string
  project: Project
}

export interface CreateTagRequest {
  name: string
  type: string
}
export default interface Project extends Entity {
  name: string
  files: FileEntry[]
  creator?: User
  visualizations: Visualization[]
  tags: Tag[]
}
