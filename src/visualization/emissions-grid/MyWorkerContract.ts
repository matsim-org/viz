export interface InitParams {
  accessToken: string
  bins: any[]
  cellSize: string
  projectId: string
  projection: string
  url: string
}

/*
export interface PlanRequestParams {
  idIndex: number
}
*/

export enum MethodNames {
  LoadData = 'LoadData',
}
