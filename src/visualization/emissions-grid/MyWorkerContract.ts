export interface InitParams {
  accessToken: string
  projectId: string
  bins: any[]
  url: string
}

/*
export interface PlanRequestParams {
  idIndex: number
}
*/

export enum MethodNames {
  FetchEmissionsData = 'FetchEmissionsData',
}
