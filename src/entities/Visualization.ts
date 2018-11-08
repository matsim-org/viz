import Entity from '@/entities/Entity'
import Project from '@/entities/Project'

export interface CreateVisualizationRequest {
  projectId?: string
  typeKey?: string
  inputFiles: { [key: string]: string } // use this notation since Map-type is not yet supported by (de)serialization
  inputParameters: { [key: string]: string } // as with inputFiles
}

export interface VisualizationType {
  typeName: string
  requiredFileKeys: string[]
  requiredParamKeys: string[]
}

export interface Visualization extends Entity {
  inputFiles: string[]
  parameters: string[]
  project: Project
  type: VisualizationType
}
