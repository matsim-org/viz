import Entity from './Entity'
import Project from './Project'

export interface CreateVisualizationRequest {
  projectId?: string
  typeKey?: string
  inputFiles: Map<string, string>
  inputParameters: Map<string, string>
}

export interface VisualizationType extends Entity {
  key: string
  requiresProcessing: boolean
  endpoint?: URL
  requiredFileKeys: String[]
  requiredParamKeys: String[]
}

export interface Visualization extends Entity {
  inputFiles: string[]
  parameters: string[]
  project: Project
  type: VisualizationType
}
