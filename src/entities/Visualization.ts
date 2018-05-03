import Entity from './Entity'
import Project from './Project'

export interface CreateVisualizationRequest {
  projectId?: string
  typeKey?: string
  inputFiles?: Map<string, string>
  inputPrameters?: Map<string, string>
}
