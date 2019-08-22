import firebase from 'firebase/app'
import 'firebase/firestore'

import sharedStore, { SearchResult } from '@/SharedStore.ts'
import { Visualization } from '@/entities/Entities'

export interface ProjectAttributes {
  owner: string
  title: string
  urlslug: string
  description: string
  public?: boolean
  mvizkey?: string
  imported?: boolean
  notes: string
}

export interface RunAttributes {
  owner: string
  project: string
  runId: string
  description: string
  public?: boolean
  notes: string
}

export interface FileAttributes {
  owner: string
  project: string
  runId: string
  filename: string
  sizeinbytes?: number
  mvizkey?: string
}

export interface VizAttributes {
  id: string
  title: string
  owner: string
  project: string
  runId: string
  startPage?: boolean
}

export interface OwnerAttributes {
  uid: string
  username: string
  notes: string
  details: string
  isGroup?: boolean
  members?: string[]
}

export default class FireBaseAPI {
  private static db: firebase.firestore.Firestore

  public static async setDb() {
    FireBaseAPI.db = firebase.firestore()
  }

  public static async setCurrentUser(userId: string) {
    console.log('--> setting current user for uid:', userId)

    const db = firebase.firestore()

    const docs = await db
      .collection('users')
      .where('uid', '==', userId)
      .get()

    // perhaps user hasn't created an account yet:
    if (docs.empty) {
      console.log('NO ACCOUNT')
      sharedStore.setNagUserToLogin(true)
    } else {
      // get user details
      let userKey = ''
      docs.forEach(doc => {
        userKey = doc.id
      })
      sharedStore.setCurrentUser(userKey)
      console.log('GOT:', userKey)
    }
  }

  public static async canUserModify(ownerId: string) {
    console.log('canUserModify', ownerId)

    const currentUser = sharedStore.state.currentUser
    console.log({ currentUser })

    // not logged in?
    if (!currentUser) return false

    // is it me?
    if (currentUser === ownerId) return true

    // not a team?
    const ownerDetails: any = await FireBaseAPI.getOwner(ownerId)
    if (!ownerDetails.isgroup) return false

    // am I on the team list?
    if (ownerDetails.members && ownerDetails.members.indexOf(currentUser) > -1) return true

    return false
  }

  public static async getOwner(owner: string) {
    console.log('getOwner', owner)
    const db = firebase.firestore()
    const user = await db
      .collection('users')
      .doc(owner)
      .get()

    return user.data()
  }

  public static async getProjectsForUser(owner: string) {
    console.log('getProjectsForUser', owner)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .get()

    const projects: any[] = []
    docs.forEach(project => {
      projects.push(project.data())
    })

    return projects
  }

  public static async getProjectById(projectId: string) {
    console.log('getProjectById', projectId)

    const docs = await this.db
      .collectionGroup('projects')
      .where('mvizkey', '==', projectId)
      .limit(1)
      .get()

    const data: any = []
    docs.forEach(project => {
      data.push(project.data())
    })
    if (data.length) return data[0]
    return null
  }

  public static async getProject(owner: string, projectId: string) {
    console.log('getProject', owner, projectId)

    const db = firebase.firestore()
    const project = await db.doc(`users/${owner}/projects/${projectId}`).get()

    const result = project.data()
    if (result && !result.notes) result.notes = ''

    console.log({ getproject: result })
    return result
  }

  public static async createProject(props: ProjectAttributes) {
    console.log({ createProject: props })

    if (!props.public) props.public = false

    const db = firebase.firestore()
    await db.doc(`users/${props.owner}/projects/${props.urlslug}`).set(props)
  }

  public static async getRun(owner: string, projectId: string, runId: string) {
    console.log('getRun', owner, projectId, runId)

    const db = firebase.firestore()
    const run = await db.doc(`users/${owner}/projects/${projectId}/runs/${runId}`).get()

    const result = run.data()
    if (result && !result.notes) result.notes = ''

    return result
  }

  public static async getOwners() {
    console.log('getOwners')

    const docs = await this.db.collection('users').get()

    const owners: any[] = []
    docs.forEach(doc => {
      owners.push(doc.data())
    })

    return owners as OwnerAttributes[]
  }

  public static async getRuns(owner: string, projectId: string) {
    console.log('getRuns', owner, projectId)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .get()

    const runs: any[] = []
    docs.forEach(doc => {
      runs.push(doc.data())
    })

    return runs
  }

  public static async getFiles(owner: string, projectId: string, run: string) {
    console.log('getFiles', owner, projectId, run)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .doc(run)
      .collection('files')
      .get()

    const files: any[] = []
    docs.forEach(doc => {
      files.push(doc.data())
    })

    return files
  }

  public static async createRun(props: RunAttributes) {
    console.log({ createRun: props })

    if (!props.public) props.public = false

    const db = firebase.firestore()
    await db.doc(`users/${props.owner}/projects/${props.project}/runs/${props.runId}`).set(props)
  }

  public static async deleteVisualization(owner: string, project: string, run: string, vizId: string) {
    console.log('deleting viz:', owner, project, run, vizId)
    const db = firebase.firestore()
    await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(project)
      .collection('runs')
      .doc(run)
      .collection('visualizations')
      .doc(vizId)
      .delete()
  }

  public static async createVisualization(viz: Visualization, owner: string, project: string, run: string) {
    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(project)
      .collection('runs')
      .doc(run)
      .collection('visualizations')
      .get()

    // make sure we have the server-assigned viz Id stored!
    const vizDetails = {
      id: viz.id,
      createdAt: viz.createdAt,
      owner: owner,
      parameters: viz.parameters,
      project: project,
      projectId: viz.project.id,
      properties: viz.properties,
      runId: run,
      title: viz.title,
      type: viz.type,
      updatedAt: viz.createdAt,
    }

    console.log({ createViz: vizDetails })

    await db.doc(`users/${owner}/projects/${project}/runs/${run}/visualizations/${viz.id}`).set(vizDetails)
    console.log('done adding')
  }

  public static async addFiles(files: FileAttributes[]) {
    const db = firebase.firestore()

    const batch = db.batch()
    for (const props of files) {
      const location = `users/${props.owner}/projects/${props.project}/runs/${props.runId}/files/${props.filename}`
      console.log({ location })
      const doc = db.doc(location)
      batch.set(doc, props)
    }
    await batch.commit()
  }

  public static async updateDoc(location: string, attributes: any) {
    const db = firebase.firestore()
    const doc = db.doc(location)
    await doc.update(attributes)
  }

  public static async createDoc(location: string, attributes: any) {
    const db = firebase.firestore()
    await db.doc(location).set(attributes)
  }

  public static async addVisualizations(visualizations: VizAttributes[]) {
    const db = firebase.firestore()

    const batch = db.batch()
    for (const props of visualizations) {
      const location = `users/${props.owner}/projects/${props.project}/runs/${props.runId}/visualizations/${props.id}`
      console.log({ location })
      const doc = db.doc(location)
      batch.set(doc, props)
    }
    await batch.commit()
  }

  public static async getVisualizations(owner: string, projectId: string, run: string) {
    console.log('getVisualizations', owner, projectId, run)

    const db = firebase.firestore()
    const docs = await db
      .collection('users')
      .doc(owner)
      .collection('projects')
      .doc(projectId)
      .collection('runs')
      .doc(run)
      .collection('visualizations')
      .get()

    const data: any[] = []
    docs.forEach(doc => {
      data.push(doc.data())
    })

    return data
  }

  public static async getPublicVisualizations() {
    console.log('getPublicVisualizations')

    // first get startPage'd vizes
    const docs = await this.db
      .collectionGroup('visualizations')
      .where('startPage', '==', true)
      .get()

    const vizes: any[] = []
    docs.forEach(doc => {
      vizes.push(doc.data())
    })

    // group them by project; i hate firebase sub-collections
    const projects: any = {}
    for (const viz of vizes) {
      if (!projects[viz.projectId]) {
        projects[viz.projectId] = { title: '', owner: '', urlslug: viz.project, id: viz.projectId, visualizations: [] }
      }
      projects[viz.projectId].visualizations.push(viz)
    }

    return Object.values(projects)
  }

  public static async searchForText(searchTerm: string) {
    console.log('SEARCH FOR:', searchTerm)

    const db = firebase.firestore()

    const allResults = await Promise.all([
      await FireBaseAPI.searchUsers(db, searchTerm),
      await FireBaseAPI.searchProjects(db, searchTerm),
    ])
    return ([] as any).concat(...allResults)
  }

  private static async searchUsers(db: firebase.firestore.Firestore, searchTerm: string) {
    const results: SearchResult[] = []

    const users = await db.collection('users').get()
    users.forEach(doc => {
      const record = doc.data()
      if (
        record.username.toLowerCase().indexOf(searchTerm) > -1 ||
        record.details.toLowerCase().indexOf(searchTerm) > -1
      ) {
        results.push({
          title: record.username,
          subtitle: record.details,
          url: `/${record.username}`,
          collection: 'User',
        })
      }
    })
    return results
  }

  private static async searchProjects(db: firebase.firestore.Firestore, searchTerm: string) {
    const results: SearchResult[] = []

    const projects = await db.collectionGroup('projects').get()
    projects.forEach(doc => {
      const record = doc.data()
      if (record.urlslug.indexOf(searchTerm) > -1 || record.title.toLowerCase().indexOf(searchTerm) > -1) {
        results.push({
          title: record.title,
          subtitle: record.description,
          collection: 'Project',
          url: `/${record.owner}/${record.urlslug}`,
        })
      }
    })
    return results
  }
}
