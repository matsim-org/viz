import Store from './Store'
import Mutation from './Mutation'
import instance from '@/router'
import FileAPI from '@/communication/FileAPI'
import Project from '@/entities/Project'
import Dispatcher from './Dispatcher'

export interface ProjectState {
  projects: any[]
  isFetching: boolean
}

export interface ProjectPayload {
  projects: Project[]
}

export interface BooleanPayload {
  value: boolean
}

export class AddProjects extends Mutation<ProjectPayload> {}
export class SetIsFetching extends Mutation<BooleanPayload> {}

export abstract class ProjectActions {
  public static fetchProjects = async function() {
    Dispatcher.commit(new SetIsFetching({ value: true }))
    try {
      const projects = await FileAPI.fetchAllPersonalProjects()
      Dispatcher.commit(new AddProjects({ projects: projects }))
    } finally {
      Dispatcher.commit(new SetIsFetching({ value: false }))
    }
  }
}

class ProjectStore extends Store<ProjectState> {
  public handleMutation<P>(mutation: Mutation<P>) {
    if (mutation instanceof AddProjects) {
      mutation.Payload.projects.forEach(project => this.State.projects.push(project))
    } else if (mutation instanceof SetIsFetching) {
      this.State.isFetching = mutation.Payload.value
    }
  }

  protected getInitialState() {
    return {
      projects: [],
      isFetching: false,
    }
  }
}

export default new ProjectStore()
