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
export interface Visualization extends Entity {
  type: string
  inputFiles: string[]
  parameters: string[]
  project: Project
}

export interface FileEntry extends Entity {
  contentType: string
  project: Project
  sizeInBytes: number
  userFileName: string
}
