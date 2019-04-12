export interface Entity {
  id: string
}

export interface Agent extends Entity {
  authId: string
  name: string
}

export interface User extends Agent {
  projects: Project[]
}

export interface Resource extends Entity {
  createdAt: number
  permissions: Permission[]
}

export interface Project extends Resource {
  name: string
  creator?: User
  files: FileEntry[]
  visualizations: Visualization[]
  tags: Tag[]
  permissions: Permission[]
}

export enum PermissionType {
  Read = 'Read',
  Write = 'Write',
  Delete = 'Delete',
  Owner = 'Owner',
}

export interface Permission extends Entity {
  agent: Agent
  resource: Resource
  type: PermissionType
}

export interface Tag extends Entity {
  name: string
  type: string
  project: Project
}

export interface VisualizationType {
  typeName: string
  prettyName: string
  description?: string
  requiredFileKeys: string[]
  requiredParamKeys: string[]
}

export interface InputFile extends Entity {
  fileEntry: FileEntry
  inputKey: string
  visualization: Visualization
}

export interface Visualization extends Entity {
  type: string
  title: string
  thumbnail: string // supposed to be a base64 encoded image
  properties: { [id: string]: any }
  inputFiles: { [id: string]: InputFile }
  parameters: { [id: string]: Parameter }
  project: Project
}

export interface Parameter extends Entity {
  value: string
}

export interface FileEntry extends Entity {
  contentType: string
  project: Project
  sizeInBytes: number
  tags: Tag[]
  userFileName: string
}
