import Entity from './Entity'
import User from './User'
import { Visualization } from './Visualization'
import FileEntry from './File'

export default interface Project extends Entity {
  name: string
  files: FileEntry[]
  creator?: User
  visualizations: Visualization[]
}
