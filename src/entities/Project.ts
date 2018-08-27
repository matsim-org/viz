import Entity from '@/entities/Entity'
import User from '@/entities/User'
import { Visualization } from '@/entities/Visualization'
import FileEntry from '@/entities/File'

export default interface Project extends Entity {
  name: string
  files: FileEntry[]
  creator?: User
  visualizations: Visualization[]
}
