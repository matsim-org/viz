export interface InitParams {
  dataUrl: string
  vizId: string
}

export interface PlanRequestParams {
  idIndex: number
}

export enum MethodNames {
  FetchPlan = 'FetchPlan',
}
