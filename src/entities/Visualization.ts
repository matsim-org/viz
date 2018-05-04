import Entity from './Entity'
import Project from './Project'

export interface CreateVisualizationRequest {
  projectId?: string
  typeKey?: string
  inputFiles: Map<string, string>
  inputParameters: Map<string, string>
}
